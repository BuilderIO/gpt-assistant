import type { RequestEvent } from '@builder.io/qwik-city';
import { z } from '@builder.io/qwik-city';
import { attempt } from '../ai';
import { runAction } from '~/functions/run-action';

const schema = z.object({
  action: z.object({
    id: z.string(),
    data: z.any(),
  }),
  persist: z.boolean().optional(),
});

export const onPost = async (request: RequestEvent) => {
  const body = await request.parseBody();
  const values = attempt(() => schema.parse(body));
  if (values instanceof Error) {
    return request.json(401, { error: values.message });
  }
  const { action, persist } = values;
  const result = await runAction(
    {
      data: action.data,
      id: BigInt(action.id),
    },
    persist
  );
  return request.json(200, { result });
};
