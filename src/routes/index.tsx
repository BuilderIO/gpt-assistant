import { $, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { streamCompletion } from "../functions/stream-completion";
import { RenderResult } from "~/components/render-result/render-result";
import { Loading } from "~/components/loading/loading";
import { getActionsPrompt } from "~/prompts/actions";
import { getBrowsePrompt } from "~/prompts/browse";
import { Actions } from "~/components/actions/actions";

function autogrow(el: HTMLTextAreaElement) {
  // Autogrow
  setTimeout(() => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

const useActions = false;

function getDefaultPrompt() {
  return useActions ? getActionsPrompt() : getBrowsePrompt();
}

export default component$(() => {
  const prompt = useSignal("");
  const output = useSignal("");
  const loading = useSignal(false);
  const promptTextarea = useSignal<HTMLTextAreaElement>();

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
      <form
        class="flex flex-col w-full px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md"
        preventdefault:submit
        onSubmit$={async () => {
          update();
        }}
      >
        <h1 class="text-2xl font-bold text-center">AI Agent</h1>
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
          class="w-auto p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
          bind:value={prompt}
        />
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>
      </form>
      <div class="w-full">
        <Actions />
        {output.value && (
          <div class="flex flex-col w-full px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md">
            <h2 class="text-2xl font-bold text-center">Output</h2>
            <div class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
              <RenderResult
                response={output.value}
                onUpdate={$(async () => {
                  prompt.value = await getDefaultPrompt();
                  update();
                })}
              />
            </div>
          </div>
        )}
        {loading.value && <Loading />}
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [],
};
