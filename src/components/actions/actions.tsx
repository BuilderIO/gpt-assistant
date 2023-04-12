import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { Form, globalAction$, server$, z, zod$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { Loading } from "../loading/loading";
import type {
  BrowserAction,
  NavigateAction,
} from "~/functions/get-page-contents";
import { Card } from "../card/card";
import { ActionsContext } from "~/routes";
import { getPageContents } from "~/functions/get-page-contents";

export type ActionWithId = {
  id: string;
  action: BrowserAction;
};

export const getActions = server$(async () => {
  const prisma = new PrismaClient();
  return (await prisma.actions.findMany()).map(
    (action) =>
      ({
        id: String(action.id),
        action: action.data as BrowserAction,
      } satisfies ActionWithId)
  );
});

export async function getActionsWithoutId() {
  return (await getActions()).map(({ action }) => action);
}

async function createAction(action: BrowserAction) {
  const prisma = new PrismaClient();
  return await prisma.actions.create({
    data: action as any,
  });
}

export const useCreateTaskAction = globalAction$(async ({ action }) => {
  return await createAction(JSON.parse(action));
}, zod$({ action: z.string() }));

export const Actions = component$((props: { class?: string }) => {
  const createTaskAction = useCreateTaskAction();
  const loading = useSignal(false);
  const actions = useSignal([] as ActionWithId[]);
  const actionsContext = useContext(ActionsContext);

  const updateActions = $(async () => {
    loading.value = true;
    actions.value = await getActions();
    loading.value = false;
  });

  useTask$(async ({ track }) => {
    track(() => actionsContext.value);
    await updateActions();
  });

  return (
    <Card class={props.class}>
      <h3 class="text-lg leading-6 font-medium text-gray-900">Actions</h3>
      {loading.value && <Loading />}

      {actions.value.map((action) => {
        return (
          <div key={action.id} class="flex flex-row space-x-4">
            <pre class="border rounded p-4 bg-gray-100">
              {JSON.stringify(action.action)}
            </pre>
            <button
              onClick$={async () => {
                loading.value = true;
                await server$(async () => {
                  const prisma = new PrismaClient();
                  await prisma.actions.delete({
                    where: { id: BigInt(action.id) },
                  });
                })();
                updateActions();
                loading.value = false;
              }}
            >
              Delete
            </button>
          </div>
        );
      })}

      <Form action={createTaskAction}>
        <input
          name="action"
          class="border border-gray-400 rounded shadow p-2 mr-2"
        />
        <button
          class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
          onClick$={async () => {
            loading.value = true;
            await server$(async () => {
              const prisma = new PrismaClient();
              await prisma.actions.deleteMany();
            })();
            updateActions();
            loading.value = false;
          }}
        >
          Add action
        </button>
      </Form>
      {!!actions.value.length && (
        <div class="flex gap-3">
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
            onClick$={async () => {
              loading.value = true;
              const url = (actions.value[0].action as NavigateAction).url;
              const html = await getPageContents(
                url,
                actions.value.map((action) => action.action)
              );
              server$(async () => {
                const prisma = new PrismaClient();
                await prisma.browserState.upsert({
                  where: { id: 1 },
                  update: { html },
                  create: { id: 1, html },
                });
              })();
              loading.value = false;
            }}
          >
            Run Actions
          </button>
          <button
            class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            onClick$={async () => {
              loading.value = true;
              await server$(async () => {
                const prisma = new PrismaClient();
                await prisma.actions.deleteMany();
                await prisma.browserState.deleteMany();
              })();
              updateActions();
              loading.value = false;
            }}
          >
            Clear Actions
          </button>
        </div>
      )}
    </Card>
  );
});
