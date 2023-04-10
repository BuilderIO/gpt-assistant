import { useTask$ } from "@builder.io/qwik";
import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { getQuestions } from "~/functions/questions";
import { streamCompletion } from "../functions/stream-completion";
import { RenderResult } from "~/components/render-result/render-result";
import { Loading } from "~/components/loading/loading";

async function getDefaultPrompt() {
  return `
You are a bot that helps me accomplish things. These are the tools you have at your disposal. You can call them as functions, like:

// Returns the HTML of the website
function loadWebsite(url: string)

// Interacts with a website and returns the HTML
function interactWithWebsite(url: string, selector: string, action: 'click' | 'input', text?: string)

// Asks a question to me and the answer will be provided in the next prompt
function ask(question: string)

For any questions you ask, I will include the answer in the next prompt.

Here are the answers to previous questions:
${(await getQuestions())
  .map((question) => `- ${question.question}? ${question.answer}`)
  .join("\n")}

Please describe in terms of the functions above how you would help me accomplish the following tasks. Please describe what you 
would do next up until you can't do anything anymore until your questions are answered.

The task you are being asked to do:
Book me a restaurant

What is the first thing you would need to do? Your options are:
- asking me a question (tell me the question) 
- loading a website (tell me the website to load) 
- interacting with the website (tell me what selector to click or input text to)

Please answer with only 1 next step. And use the functions above, like:

ask("What is your location?")

or

loadWebsite("https://www.google.com")

or 

interactWithWebsite("https://www.google.com", "input[name='q']", "input", "book a restaurant")

If you need to ask multiple questions, put them on separate lines, like:
ask("What is your location?")
ask("What type of event would you like to go to?")
`;
}

function autogrow(el: HTMLTextAreaElement) {
  // Autogrow
  setTimeout(() => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  });
}

export default component$(() => {
  const prompt = useSignal("");
  const output = useSignal("");
  const loading = useSignal(false);

  useTask$(async () => {
    prompt.value = await getDefaultPrompt();
  });

  return (
    <>
      <form
        class="flex flex-col w-full max-w-xl px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md my-6"
        preventdefault:submit
        onSubmit$={async () => {
          output.value = "";
          loading.value = true;
          await streamCompletion(prompt.value, (value) => {
            output.value += value;
          });
          loading.value = false;
          console.debug("Final value:", output.value);
        }}
      >
        <h1 class="text-2xl font-bold text-center">AI Agent</h1>
        <textarea
          style={{
            "box-sizing": "content-box",
            "min-height": "100px",
          }}
          onFocus$={(e, el) => {
            autogrow(el);
          }}
          onBlur$={(e, el) => {
            el.style.height = "auto";
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
      {output.value && (
        <div class="flex flex-col w-full max-w-xl px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md my-6">
          <h2 class="text-2xl font-bold text-center">Output</h2>
          <div class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
            <RenderResult response={output.value} />
          </div>
        </div>
      )}
      {loading.value && <Loading />}
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [],
};
