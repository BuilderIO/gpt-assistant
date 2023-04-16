import { $, component$, useContext, useSignal } from '@builder.io/qwik';
import { Form, globalAction$, server$, z, zod$ } from '@builder.io/qwik-city';
import { prismaClient } from '~/constants/prisma-client';
import type { ActionStep } from '~/functions/run-action';
import {
  ActionsContext,
  ActionsList,
  BrowserStateContext,
  ContinueRunning,
} from '~/routes';
import { Card } from '../card/card';
import { Loading } from '../loading/loading';
import type { Actions as Action } from '@prisma/client';

export type ActionWithId = Pick<Action, 'data' | 'id'>;

export const getActions = server$(async () => {
  return await prismaClient!.actions.findMany({
    select: { id: true, data: true },
  });
});

export async function getActionsWithoutId() {
  return (await getActions()).map(({ data }) => data);
}

async function createAction(action: ActionStep) {
  return await prismaClient!.actions.create({
    data: action as any,
  });
}

export const useCreateTaskAction = globalAction$(async ({ action }) => {
  return await createAction(JSON.parse(action));
}, zod$({ action: z.string() }));

const showAddAction = false;
const PERSIST = true;

export async function runAndSave(
  action: Pick<Action, 'data' | 'id'>,
  persist = PERSIST
) {
  await fetch('/api/v1/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: {
        ...action,
        id: String(action.id),
      },
      persist,
    }),
  }).then((res) => res.json());
}

export const Actions = component$((props: { class?: string }) => {
  const createTaskAction = useCreateTaskAction();
  const loading = useSignal(false);
  const actions = useContext(ActionsList);
  const actionsContext = useContext(ActionsContext);
  const browserStateContext = useContext(BrowserStateContext);
  const continueRunningContext = useContext(ContinueRunning);
  const error = useSignal('');

  const updateActions = $(async () => {
    loading.value = true;
    // eslint-disable-next-line qwik/valid-lexical-scope
    actions.value = await getActions();
    loading.value = false;
  });

  const clearActions = $(async () => {
    loading.value = true;
    await server$(async () => {
      await prismaClient!.actions.deleteMany();
      await prismaClient!.browserState.deleteMany();
      await prismaClient!.answers.deleteMany();
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
              key={String(action.id)}
              class="relative flex flex-row space-x-4 w-full"
            >
              <pre class="border rounded p-4 bg-gray-100 overflow-auto text-sm w-full">
                {JSON.stringify(action.data, null, 2)}
              </pre>
              {!continueRunningContext.value && (
                <button
                  onClick$={async () => {
                    // eslint-disable-next-line qwik/valid-lexical-scope
                    if (actions.value.length === 1) {
                      await clearActions();
                    } else {
                      loading.value = true;
                      await server$(async () => {
                        await prismaClient!.actions.delete({
                          // eslint-disable-next-line qwik/valid-lexical-scope
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
                await prismaClient!.actions.deleteMany();
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
                  // eslint-disable-next-line qwik/valid-lexical-scope
                  await runAndSave(actions.value.at(-1)!);
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
