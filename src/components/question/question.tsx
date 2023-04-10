import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { streamCompletion } from "~/functions/stream-completion";
import { Loading } from "../loading/loading";

function getFullPrompt(question: string) {
  return `
I am going to ask a question. Please answer as if you are me. Just
pretend you are Steve, a 33 year old software developer in San Francisco.

How would Steve respond to the following question? 
Please only give the response and nothing else.

The question: ${question}
`;
}

export const Question = component$(
  (props: { question: string; isPartial?: boolean }) => {
    const answer = useSignal("");
    const loading = useSignal(false);

    // TODO: checkbox to turn this off or until just a suggestion
    useVisibleTask$(async ({ track }) => {
      const isPartial = track(() => !props.isPartial);

      if (isPartial) {
        loading.value = true;
        await streamCompletion(getFullPrompt(props.question), (value) => {
          answer.value += value;
        });
        loading.value = false;
      }
    });

    return (
      <div class="w-auto h-64 bg-white rounded-xl shadow-lg p-8">
        <h2 class="font-bold text-2xl mb-2">{props.question}</h2>
        <textarea
          class="p-2 border-2 border-gray-200 w-full mb-2"
          bind:value={answer}
        />
        {loading.value && <Loading />}
        <pre class="mt-4">{answer.value}</pre>
      </div>
    );
  }
);
