import type { PropFunction } from '@builder.io/qwik';
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { streamCompletion } from '~/functions/stream-completion';
import { Loading } from '../loading/loading';
import { addQuestion } from '~/functions/questions';

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
  ({
    question,
    isPartial,
    onUpdate$,
  }: {
    question: string;
    isPartial?: boolean;
    onUpdate$: PropFunction<(answer: string) => void>;
  }) => {
    const answer = useSignal('');
    const loading = useSignal(false);

    // TODO: checkbox to turn this off or until just a suggestion
    useVisibleTask$(async ({ track }) => {
      const partial = track(() => !isPartial);

      if (partial) {
        loading.value = true;
        await streamCompletion(getFullPrompt(question), (value) => {
          answer.value += value;
        });
        loading.value = false;
      }
    });

    return (
      <div class="w-auto bg-white rounded-xl shadow-lg p-8">
        <h3 class="font-bold mb-2">{question}</h3>
        <textarea
          class="p-2 border-2 border-gray-200 w-full mb-2"
          bind:value={answer}
        />
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick$={async () => {
            await addQuestion(question, answer.value);
            onUpdate$(answer.value);
          }}
        >
          Answer
        </button>
        {loading.value && <Loading />}
      </div>
    );
  }
);
