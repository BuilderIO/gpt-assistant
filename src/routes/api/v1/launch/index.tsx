import type { RequestEvent } from '@builder.io/qwik-city';
import { z } from '@builder.io/qwik-city';

const schema = z.object({
  prompt: z.string(),
});

export async function onPost(request: RequestEvent) {
  const body = await request.parseBody();
  const value = schema.parse(body);
  return request.json(200, {
    redirect: `http://localhost:5173/?run=${encodeURIComponent(value.prompt)}`,
  });
}
