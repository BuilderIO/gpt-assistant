import { $, component$, useSignal, useTask$ } from "@builder.io/qwik";
import { Card } from "../card/card";
import { Form, globalAction$, z, zod$ } from "@builder.io/qwik-city";
import { getPrompt } from "~/prompts/browse";
import { PrismaClient } from "@prisma/client";
import { Loading } from "../loading/loading";

export const useUpdatePrompt = globalAction$(
  async ({ prompt }) => {
    const prisma = new PrismaClient();
    await prisma.prompt.upsert({
      update: { text: prompt },
      create: { text: prompt },
      where: {
        id: 1,
      },
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

  const updatePrompt = $(async () => {
    loading.value = true;
    prompt.value = (await getPrompt()) || "";
    loading.value = false;
  });

  useTask$(() => updatePrompt());

  return (
    <Card class={props.class}>
      <h1>Prompt</h1>
      <Form action={updatePromptAction}>
        <textarea
          onKeyPress$={(e) => {
            console.log("keypress");
            if (
              e.key === "Enter" &&
              !(e.metaKey || e.shiftKey || e.ctrlKey || e.altKey)
            ) {
              console.log("submit?");
              updatePromptAction.submit({
                prompt: prompt.value,
              });
            }
          }}
          placeholder="Your prompt"
          bind:value={prompt}
          class="block w-full px-4 py-2 mt-1 text-base text-gray-700 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </Form>
      {(loading.value || updatePromptAction.isRunning) && <Loading />}
    </Card>
  );
});
