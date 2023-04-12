import {
  $,
  Signal,
  createContextId,
  useContextProvider,
  useTask$,
  useVisibleTask$,
} from "@builder.io/qwik";
import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { streamCompletion } from "../functions/stream-completion";
import { RenderResult } from "~/components/render-result/render-result";
import { Loading } from "~/components/loading/loading";
import { getActionsPrompt } from "~/prompts/actions";
import { getBrowsePrompt } from "~/prompts/browse";
import { Actions } from "~/components/actions/actions";
import { Prompt } from "~/components/prompt/prompt";

function autogrow(el: HTMLTextAreaElement) {
  // Autogrow
  setTimeout(() => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

const useActions = false;

export const ActionsContext = createContextId<Signal<number>>(
  "index.actionsContext"
);

function getDefaultPrompt() {
  return useActions ? getActionsPrompt() : getBrowsePrompt();
}

export default component$(() => {
  const prompt = useSignal("");
  const output = useSignal("");
  const loading = useSignal(false);
  const actionsKey = useSignal(0);
  const promptTextarea = useSignal<HTMLTextAreaElement>();

  useContextProvider(ActionsContext, actionsKey);

  useTask$(async () => {
    prompt.value = await getDefaultPrompt();
  });

  useVisibleTask$(async () => {
    autogrow(promptTextarea.value!);
    promptTextarea.value?.focus();
  });

  const update = $(async () => {
    output.value = "";
    loading.value = true;
    await streamCompletion(prompt.value, (value) => {
      output.value += value;
    });
    loading.value = false;
    console.debug("Final value:", output.value);
  });

  return (
    <div class="flex gap-10 p-10 max-w-[1200px] mx-auto">
      <div class="w-full flex flex-col">
        <Prompt class="mb-6" />
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
              "max-height": "80vh",
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
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Submit
          </button>
        </form>
      </div>
      <div class="w-full">
        <Actions key={actionsKey.value} class="mb-6" />
        {output.value && (
          <div class="flex flex-col w-full px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Output</h3>
            <RenderResult
              response={output.value}
              whenAddActions$={() => {
                actionsKey.value++;
              }}
            />
          </div>
        )}
        {loading.value && <Loading />}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "AI Agent",
  meta: [],
};
