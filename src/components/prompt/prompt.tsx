import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { Card } from "../card/card";
import { Form, globalAction$, server$, z, zod$ } from "@builder.io/qwik-city";
import { getPrompt } from "~/prompts/browse";
import { PrismaClient } from "@prisma/client";
import { Loading } from "../loading/loading";
import {
  ActionsContext,
  BrowserStateContext,
  GetCompletionContext,
  ShowBigStopButton,
} from "~/routes";

export const useUpdatePrompt = globalAction$(
  async ({ prompt }) => {
    const prisma = new PrismaClient();
    await prisma.prompt.upsert({
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
  const prompt = useSignal("");

  const completionContext = useContext(GetCompletionContext);
  const actionsContext = useContext(ActionsContext);
  const browserStateContext = useContext(BrowserStateContext);
  const showBigStopButton = useContext(ShowBigStopButton);

  const updatePrompt = $(async () => {
    loading.value = true;
    prompt.value = (await getPrompt()) || "";
    loading.value = false;
  });

  useTask$(() => updatePrompt());

  useTask$(({ track }) => {
    if (track(() => showBigStopButton.value) === false) {
      loading.value = false;
    }
  });

  const clearActions = $(async () => {
    await server$(async () => {
      const prisma = new PrismaClient();
      await prisma.actions.deleteMany();
      await prisma.browserState.deleteMany();
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
    await completionContext();
    (document.querySelector("#continue-button") as HTMLElement).click();
  });

  return (
    <Card class={props.class}>
      <h3 class="text-lg leading-6 font-medium text-gray-900">User Prompt</h3>
      <Form action={updatePromptAction}>
        <textarea
          onKeyUp$={(e) => {
            if (
              e.key === "Enter" &&
              !(e.metaKey || e.shiftKey || e.ctrlKey || e.altKey)
            ) {
              run();
              // Next tick
              // Promise.resolve().then(() => {
              prompt.value = prompt.value.trim();
              // });
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
