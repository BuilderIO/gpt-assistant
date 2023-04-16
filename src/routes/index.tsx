import type { QRL, Signal } from '@builder.io/qwik';
import {
  $,
  component$,
  createContextId,
  useContextProvider,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import {
  ActionWithId,
  Actions,
  getActions,
} from '~/components/actions/actions';
import { BrowserState } from '~/components/browser-state/browser-state';
import { Loading } from '~/components/loading/loading';
import { Prompt } from '~/components/prompt/prompt';
import { RenderResult } from '~/components/render-result/render-result';
import { getBrowsePrompt } from '~/prompts/get-action';
import { streamCompletion } from '../functions/stream-completion';

Error.stackTraceLimit = Infinity;

function autogrow(el: HTMLTextAreaElement) {
  // Autogrow
  setTimeout(() => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  });
}

export const ActionsContext = createContextId<Signal<number>>(
  'index.actionsContext'
);

export const BrowserStateContext = createContextId<Signal<number>>(
  'index.browserStateContext'
);
export const GetCompletionContext = createContextId<QRL<() => Promise<string>>>(
  'index.getCompletionContext'
);
export const ContinueRunning = createContextId<Signal<boolean>>(
  'index.continueRunning'
);
export const ActionsList =
  createContextId<Signal<ActionWithId[]>>('index.actionsList');

function getDefaultPrompt() {
  return getBrowsePrompt();
}

const showGptPrompt = true;

const tryJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
};

export default component$(() => {
  const prompt = useSignal('');
  const output = useSignal('');
  const loading = useSignal(false);
  const hasBegun = useSignal(false);
  const actionsKey = useSignal(0);
  const browserStateKey = useSignal(0);
  const promptTextarea = useSignal<HTMLTextAreaElement>();
  const isRunningContinuously = useSignal(false);
  const error = useSignal('');
  const actions = useSignal([] as ActionWithId[]);

  const update = $(async () => {
    output.value = '';
    error.value = '';
    loading.value = true;
    hasBegun.value = true;
    const finalMessage = await streamCompletion(prompt.value, (value) => {
      output.value += value;
    });
    const parsed = tryJsonParse(finalMessage);
    if (parsed && parsed.error) {
      error.value = JSON.stringify(parsed.error, null, 2);
    }
    loading.value = false;
    console.debug('Final value:', output.value);
    return output.value;
  });

  const hardUpdate = $(async () => {
    prompt.value = await getDefaultPrompt();
    return await update();
  });

  useContextProvider(ActionsList, actions);
  useContextProvider(ActionsContext, actionsKey);
  useContextProvider(BrowserStateContext, browserStateKey);
  useContextProvider(GetCompletionContext, hardUpdate);
  useContextProvider(ContinueRunning, isRunningContinuously);

  useTask$(async ({ track }) => {
    track(() => browserStateKey.value);
    prompt.value = await getDefaultPrompt();
  });

  useVisibleTask$(async () => {
    if (promptTextarea.value) {
      autogrow(promptTextarea.value);
      promptTextarea.value?.focus();
    }
  });

  useTask$(async ({ track }) => {
    track(() => actionsKey.value);
    // eslint-disable-next-line qwik/valid-lexical-scope
    actions.value = await getActions();
  });

  return (
    <div class="grid grid-cols-3 gap-10 p-10 max-w-[1900px] mx-auto">
      <div class="w-full flex flex-col gap-6">
        <Prompt />
        {showGptPrompt && (hasBegun.value || Boolean(actions.value.length)) && (
          <form
            class="flex w-full flex-col px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md"
            preventdefault:submit
            onSubmit$={async () => {
              update();
            }}
          >
            <h3 class="text-lg leading-6 font-medium text-gray-900">
              GPT Prompt
            </h3>
            <textarea
              ref={promptTextarea}
              style={{
                'box-sizing': 'content-box',
                'min-height': '100px',
                'max-height': '50vh',
              }}
              onFocus$={(e, el) => {
                autogrow(el);
              }}
              onKeydown$={(e, el) => {
                autogrow(el);
              }}
              class="block w-auto px-4 py-2 mt-1 text-base text-gray-700 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              bind:value={prompt}
            />
            {!isRunningContinuously.value && (
              <div class="flex flex-row gap-3">
                <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                  Submit
                </button>
              </div>
            )}
          </form>
        )}
      </div>
      <div class="w-full flex flex-col gap-6">
        <BrowserState />
        <Actions />
      </div>
      <div class="w-full">
        {output.value && <RenderResult response={output.value} />}
        {loading.value && <Loading />}
        {error.value && (
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative whitespace-pre-wrap overflow-auto">
            {error.value}
          </div>
        )}

        {isRunningContinuously.value && (
          <button
            class="fixed text-xl bottom-10 right-10 bg-red-500 hover:bg-red-700 text-white font-bold py-5 px-10 rounded z-10 shadow-lg"
            onClick$={async () => {
              isRunningContinuously.value = false;
            }}
          >
            STOP
          </button>
        )}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'AI Agent',
  meta: [],
};
