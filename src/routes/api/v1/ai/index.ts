import type { RequestEvent } from '@builder.io/qwik-city';
import { OpenAIApi, Configuration } from 'openai';
import type { ChatCompletionRequestMessage } from 'openai';
import type { AxiosError } from 'axios';
import type { IncomingMessage } from 'http';
import { z } from 'zod';

const schema = z.object({
  prompt: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
  model: z.string().optional(),
  number: z.number().optional(),
  key: z.string().optional(),
});

export function attempt<T, ErrorType = Error>(fn: () => T): T | ErrorType {
  try {
    return fn();
  } catch (err) {
    return err as ErrorType;
  }
}

export const onPost = async (request: RequestEvent) => {
  const body = await request.parseBody();
  const values = attempt(() => schema.parse(body));

  if (values instanceof Error) {
    return request.json(401, { error: values.message });
  }

  const { prompt, model, number } = values;
  const stream = await generateCompletion({ prompt, model, number });

  request.status(200);

  const response = await request.getWritableStream();
  const writer = response.getWriter();
  stream.on('data', (chunk) => {
    writer.write(chunk);
  });
  stream.on('end', () => {
    writer.close();
  });
};

function getOpenAi(key: string) {
  const openAi = new OpenAIApi(new Configuration({ apiKey: key }));
  return openAi;
}

export async function generateCompletion({
  prompt,
  key = process.env.OPENAI_KEY!,
  model,
  number,
}: {
  prompt: ChatCompletionRequestMessage[];
  model?: string;
  number?: number;
  key?: string;
}) {
  const openAi = getOpenAi(key);
  try {
    const completion = await openAi.createChatCompletion(
      {
        model: model || process.env.MODEL || 'gpt-4',
        messages: prompt,
        stream: true,
        n: number || 1,
      },
      { responseType: 'stream' }
    );
    return completion.data as unknown as IncomingMessage;
  } catch (err) {
    const error = err as AxiosError;
    return error.response!.data as IncomingMessage;
  }
}
