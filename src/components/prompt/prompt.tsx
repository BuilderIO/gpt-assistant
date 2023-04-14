import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
  useVisibleTask$,
} from '@builder.io/qwik';
import { Card } from '../card/card';
import { Form, globalAction$, server$, z, zod$ } from '@builder.io/qwik-city';
import { Loading } from '../loading/loading';
import {
  ActionsContext,
  BrowserStateContext,
  GetCompletionContext,
  ContinueRunning,
} from '~/routes';
import { prismaClient } from '~/constants/prisma-client';

export const useUpdatePrompt = globalAction$(
  async ({ prompt }) => {
    await prismaClient!.prompt.upsert({
      update: { text: prompt },
      create: { text: prompt, id: 1 },
      where: { id: 1 },
    });
  },
  zod$({
    prompt: z.string(),
  })
);

export const Prompt = component$((props: { class?: string }) => {
  const updatePromptAction = useUpdatePrompt();
  const loading = useSignal(false);
  const prompt = useSignal('');

  const runCompletion = useContext(GetCompletionContext);
  const actionsContext = useContext(ActionsContext);
  const browserStateContext = useContext(BrowserStateContext);
  const showBigStopButton = useContext(ContinueRunning);

  const clearActions = $(async () => {
    await server$(async () => {
      await prismaClient!.actions.deleteMany();
      await prismaClient!.browserState.deleteMany();
      await prismaClient!.answers.deleteMany();
    })();
    actionsContext.value++;
    browserStateContext.value++;
  });

  const run = $(async () => {
    loading.value = true;
    await updatePromptAction.submit({
      prompt: prompt.value,
    });
    await clearActions();
    if (!prompt.value) {
      return;
    }
    await runCompletion();
    // HACK: refactor
    const continueButton = document.querySelector(
      '#continue-button'
    ) as HTMLElement;

    if (!continueButton) {
      loading.value = false;
      throw new Error(
        'Cannot continue, was the streamed completion from GPT a success?'
      );
    }
    continueButton.click();
  });

  useVisibleTask$(() => {
    setTimeout(async () => {
      const url = new URL(location.href);
      const runParam = url.searchParams.get('run');
      if (runParam) {
        prompt.value = runParam;

        setTimeout(async () => {
          url.searchParams.delete('run');
          history.replaceState({}, '', url.toString());
          await run();
        }, 10);
      }
    });
  });

  useTask$(({ track }) => {
    if (track(() => showBigStopButton.value) === false) {
      loading.value = false;
    }
  });

  return (
    <Card class={props.class}>
      <h3 class="text-lg leading-6 font-medium text-gray-900">GPT Assistant</h3>
      <Form action={updatePromptAction}>
        <textarea
          onKeyPress$={(e) => {
            if (
              e.key === 'Enter' &&
              !(e.metaKey || e.shiftKey || e.ctrlKey || e.altKey)
            ) {
              run();

              // "Next tick"
              setTimeout(() => {
                prompt.value = prompt.value.trim();
              });
            }
          }}
          placeholder="Your prompt"
          bind:value={prompt}
          class="block w-full px-4 py-2 mt-1 text-base text-gray-700 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500  min-h-[100px]"
        />
      </Form>
      {loading.value || updatePromptAction.isRunning ? (
        <Loading />
      ) : (
        <button
          id="run-button"
          type="button"
          onClick$={async () => {
            run();
          }}
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Run
        </button>
      )}
    </Card>
  );
});
