import type { RequestEvent } from '@builder.io/qwik-city';
import { z } from '@builder.io/qwik-city';
import { attempt } from '../ai';
import { getPageContents } from '~/functions/get-page-contents';

const schema = z.object({
  actions: z.array(z.any()),
  persist: z.boolean().optional(),
});

export const onPost = async (request: RequestEvent) => {
  const body = await request.parseBody();
  const values = attempt(() => schema.parse(body));
  if (values instanceof Error) {
    return request.json(401, { error: values.message });
  }
  const { actions, persist } = values;
  const { html, url: newUrl } = await getPageContents(actions, persist);
  return request.json(200, { html, url: newUrl });
};
