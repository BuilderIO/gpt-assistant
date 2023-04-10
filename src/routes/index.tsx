import { component$, useSignal } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const prompt = useSignal("Book a restaurant");
  const output = useSignal("");

  return (
    <>
      <form
        class="flex flex-col w-full max-w-md px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md my-6"
        preventdefault:submit
        onSubmit$={async () => {
          const res = await fetch("/api/v1/ai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: [
                {
                  content: prompt.value,
                  role: "user",
                },
              ],
            }),
          });

          const reader = res.body!.getReader();
          const decoder = new TextDecoder("utf-8");

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }

            const text = decoder.decode(value, { stream: true });
            const strings = text
              .split("\n\n")
              .map((str) => str.trim())
              .filter(Boolean);
            let newString = "";
            for (const string of strings) {
              const prefix = "data:";
              if (string.startsWith(prefix)) {
                const json = string.slice(prefix.length);
                const content = JSON.parse(json);
                newString += content.choices[0].delta.content ?? "";
              }
            }
            output.value += newString;
          }
        }}
      >
        <h1 class="text-2xl font-bold text-center">AI Agent</h1>
        <textarea
          class="w-full h-72 p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
          bind:value={prompt}
        />
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>
      </form>
      {output.value && (
        <div class="flex flex-col w-full max-w-md px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md my-6">
          <h2 class="text-2xl font-bold text-center">Output</h2>
          <div class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
            {output.value}
          </div>
        </div>
      )}
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [],
};
