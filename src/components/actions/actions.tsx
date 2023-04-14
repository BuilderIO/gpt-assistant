import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
} from '@builder.io/qwik';
import { Form, globalAction$, server$, z, zod$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { Loading } from '../loading/loading';
import type { ActionStep } from '~/functions/get-page-contents';
import { Card } from '../card/card';
import { ActionsContext, BrowserStateContext, ContinueRunning } from '~/routes';

export type ActionWithId = {
  id: string;
  action: ActionStep;
};

const savePageContents = server$(async (html: string, url: string) => {
  const prisma = new PrismaClient();
  await prisma.browserState.upsert({
    where: { id: 1 },
    update: { html, url },
    create: { id: 1, html, url },
  });
});

export const getActions = server$(async () => {
  const prisma = new PrismaClient();
  return (await prisma.actions.findMany()).map(
    (action) =>
      ({
        id: String(action.id),
        action: action.data as ActionStep,
      } satisfies ActionWithId)
  );
});

export async function getActionsWithoutId() {
  return (await getActions()).map(({ action }) => action);
}

async function createAction(action: ActionStep) {
  const prisma = new PrismaClient();
  return await prisma.actions.create({
    data: action as any,
  });
}

export const useCreateTaskAction = globalAction$(async ({ action }) => {
  return await createAction(JSON.parse(action));
}, zod$({ action: z.string() }));

const showAddAction = false;
const PERSIST = true;

export async function runAndSave(actions: ActionStep[], persist = PERSIST) {
  const { html, url: newUrl } = await fetch('/api/v1/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actions: actions,
      persist,
    }),
  }).then((res) => res.json());
  await savePageContents(html, newUrl);
}

export const Actions = component$((props: { class?: string }) => {
  const createTaskAction = useCreateTaskAction();
  const loading = useSignal(false);
  const actions = useSignal([] as ActionWithId[]);
  const actionsContext = useContext(ActionsContext);
  const browserStateContext = useContext(BrowserStateContext);
  const continueRunningContext = useContext(ContinueRunning);
  const error = useSignal('');

  const updateActions = $(async () => {
    loading.value = true;
    actions.value = await getActions();
    loading.value = false;
  });

  useTask$(async ({ track }) => {
    track(() => actionsContext.value);
    await updateActions();
  });

  const clearActions = $(async () => {
    loading.value = true;
    await server$(async () => {
      const prisma = new PrismaClient();
      await prisma.actions.deleteMany();
      await prisma.browserState.deleteMany();
      await prisma.answers.deleteMany();
    })();
    actionsContext.value++;
    browserStateContext.value++;
    loading.value = false;
  });

  return !showAddAction && !actions.value.length ? null : (
    <Card class={props.class}>
      <h3 class="text-lg leading-6 font-medium text-gray-900">Actions</h3>

      <div class="overflow-auto max-h-[60vh] gap-6 flex flex-col">
        {actions.value.map((action) => {
          return (
            <div
              key={action.id}
              class="relative flex flex-row space-x-4 w-full"
            >
              <pre class="border rounded p-4 bg-gray-100 overflow-auto text-sm w-full">
                {JSON.stringify(action.action, null, 2)}
              </pre>
              {!continueRunningContext.value && (
                <button
                  onClick$={async () => {
                    if (actions.value.length === 1) {
                      await clearActions();
                    } else {
                      loading.value = true;
                      await server$(async () => {
                        const prisma = new PrismaClient();
                        await prisma.actions.delete({
                          where: { id: BigInt(action.id) },
                        });
                      })();
                      updateActions();
                      loading.value = false;
                    }
                  }}
                  class="absolute bottom-4 right-4 opacity-50 hover:opacity-100"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showAddAction && (
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
      )}
      {error.value && (
        <div class="text-red-500 border-4 border-red-300 p-4">
          {error.value}
        </div>
      )}
      {loading.value ? (
        <Loading />
      ) : (
        !!actions.value.length &&
        !continueRunningContext.value && (
          <div class="flex gap-3">
            <button
              id="run-actions"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
              onClick$={async () => {
                error.value = '';
                loading.value = true;
                try {
                  await runAndSave(
                    actions.value.map((action) => action.action)
                  );
                  browserStateContext.value++;
                } catch (err) {
                  error.value = String(err);
                } finally {
                  loading.value = false;
                }
              }}
            >
              Run Actions
            </button>
            <button
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
              onClick$={async () => {
                clearActions();
              }}
            >
              Clear Actions
            </button>
          </div>
        )
      )}
    </Card>
  );
});
