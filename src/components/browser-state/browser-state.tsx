import { component$, useContext, useSignal, useTask$ } from '@builder.io/qwik';
import { Card } from '../card/card';
import { BrowserStateContext } from '~/routes';
import type { BrowserState as BrowserStateType } from '@prisma/client';
import { getBrowserState } from '~/prompts/browse';
import { Loading } from '../loading/loading';

export type BrowserStateSafeType = Omit<BrowserStateType, 'id'> & {
  id: string;
};

export const BrowserState = component$(() => {
  const browserStateContext = useContext(BrowserStateContext);
  const browserState = useSignal<BrowserStateSafeType | null>(null);
  const loading = useSignal(false);

  useTask$(async ({ track }) => {
    track(() => browserStateContext.value);
    loading.value = true;
    browserState.value = await getBrowserState();
    loading.value = false;
  });

  return (
    <>
      {loading.value && <Loading />}
      {browserState.value && (
        <Card>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            Browser State
          </h3>
          <pre class="text-sm text-gray-500 w-full overflow-auto">
            {browserState.value.url}
          </pre>
          {browserState.value.html && (
            <>
              <pre class="border rounded p-4 bg-gray-100 overflow-auto text-sm">
                {browserState.value.html}
              </pre>
            </>
          )}
        </Card>
      )}
    </>
  );
});
