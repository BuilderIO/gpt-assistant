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

export const Prompt = component$(() => {
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
    <Card>
      <h1>Actions</h1>
      <Form action={updatePromptAction}>
        <textarea placeholder="Your prompt" bind:value={prompt} />
      </Form>
      {loading.value && <Loading />}
    </Card>
  );
});
