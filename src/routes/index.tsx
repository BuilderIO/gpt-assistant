import type { QRL, Signal } from "@builder.io/qwik";
import {
  $,
  component$,
  createContextId,
  useContextProvider,
  useSignal,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Actions } from "~/components/actions/actions";
import { BrowserState } from "~/components/browser-state/browser-state";
import { Loading } from "~/components/loading/loading";
import { Prompt } from "~/components/prompt/prompt";
import { RenderResult } from "~/components/render-result/render-result";
import { getBrowsePrompt } from "~/prompts/browse";
import { streamCompletion } from "../functions/stream-completion";

Error.stackTraceLimit = Infinity;

function autogrow(el: HTMLTextAreaElement) {
  // Autogrow
  setTimeout(() => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

export const ActionsContext = createContextId<Signal<number>>(
  "index.actionsContext"
);

export const BrowserStateContext = createContextId<Signal<number>>(
  "index.browserStateContext"
);
export const GetCompletionContext = createContextId<QRL<() => Promise<string>>>(
  "index.getCompletionContext"
);
export const ContinueRunning = createContextId<Signal<boolean>>(
  "index.continueRunning"
);

function getDefaultPrompt() {
  return getBrowsePrompt();
}

const showGptPrompt = false;

export default component$(() => {
  const prompt = useSignal("");
  const output = useSignal("");
  const loading = useSignal(false);
  const actionsKey = useSignal(0);
  const browserStateKey = useSignal(0);
  const promptTextarea = useSignal<HTMLTextAreaElement>();
  const showBigStopButton = useSignal(false);

  const update = $(async () => {
    output.value = "";
    loading.value = true;
    await streamCompletion(prompt.value, (value) => {
      output.value += value;
    });
    loading.value = false;
    console.debug("Final value:", output.value);
    return output.value;
  });

  const hardUpdate = $(async () => {
    prompt.value = await getDefaultPrompt();
    return await update();
  });

  useContextProvider(ActionsContext, actionsKey);
  useContextProvider(BrowserStateContext, browserStateKey);
  useContextProvider(GetCompletionContext, hardUpdate);
  useContextProvider(ContinueRunning, showBigStopButton);

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

  return (
    <div class="grid grid-cols-3 gap-10 p-10 max-w-[1900px] mx-auto">
      <div class="w-full flex flex-col gap-6">
        <Prompt />
        {showGptPrompt && (
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
                "box-sizing": "content-box",
                "min-height": "100px",
                "max-height": "50vh",
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
            <div class="flex flex-row gap-3">
              <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
                Submit
              </button>
            </div>
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
        {showBigStopButton.value && (
          <button
            class="fixed bottom-10 right-10 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded z-10"
            onClick$={async () => {
              showBigStopButton.value = false;
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
  title: "AI Agent",
  meta: [],
};
