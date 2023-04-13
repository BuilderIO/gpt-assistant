import { component$, useContext, useSignal } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { BrowserAction, parseActions } from "~/functions/get-page-contents";
import {
  ActionsContext,
  BrowserStateContext,
  GetCompletionContext,
  ShowBigStopButton,
} from "~/routes";
import { Loading } from "../loading/loading";
import { getActions, runAndSave } from "../actions/actions";
import { getBrowserState } from "~/prompts/browse";

interface TextBlock {
  type: "text";
  text: string;
}

interface QuestionBlock {
  type: "question";
  question: string;
  isPartial?: boolean;
}

type Block = TextBlock | QuestionBlock;

export function parseTextToBlocks(text: string): Block[] {
  const blocks: Block[] = [];

  for (const line of text.split("\n")) {
    const useLine = line.trim();
    if (line.startsWith("ask(")) {
      blocks.push({
        type: "question",
        question: useLine.trim().slice(5, -2),
        isPartial: !useLine.endsWith(")"),
      });
    } else {
      blocks.push({
        type: "text",
        text: line,
      });
    }
  }

  return blocks;
}

export type ResponseBlock = {
  thought?: string;
  actions: BrowserAction[];
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function parseTextToResponse(text: string) {
  try {
    const result = JSON.parse(text) as ResponseBlock;
    // Sometime an array is returned
    if (Array.isArray(result)) {
      return {
        thought: "",
        actions: result as any,
      } satisfies ResponseBlock;
    }
    // Sometimes we get a single actions object
    if (!result.actions) {
      return {
        thought: "",
        actions: [result as any],
      };
    }
    return result;
  } catch (err) {
    // That's ok, the text is likely not done streaming yet
  }
}

const insertActions = server$(async (actions: BrowserAction[]) => {
  const prisma = new PrismaClient();
  await prisma.actions.createMany({
    data: actions.map((action) => ({
      data: action,
      workflow_id: "1",
    })),
  });
});

export const RenderResult = component$((props: { response: string }) => {
  const response = parseTextToResponse(props.response);

  const actionsContext = useContext(ActionsContext);
  const browserStateContext = useContext(BrowserStateContext);
  const getCompletionContext = useContext(GetCompletionContext);
  const showBigStopButtonContext = useContext(ShowBigStopButton);
  const continueTimes = useSignal(10);

  const loading = useSignal(false);
  const approved = useSignal(false);

  return approved.value ? (
    loading.value ? (
      <Loading />
    ) : null
  ) : (
    <>
      <div class="flex flex-col w-full px-8 py-6 mx-auto space-y-4 bg-white rounded-md shadow-md">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Output</h3>
        {response ? (
          <>
            {response.thought && <p>{response.thought}</p>}
            <pre class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 overflow-auto">
              {JSON.stringify(response.actions, null, 2)}
            </pre>
            {loading.value ? (
              <Loading />
            ) : (
              <div class="flex gap-4">
                <button
                  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
                  onClick$={async () => {
                    let actions = response.actions;
                    const checkShouldStop = () => {
                      if (showBigStopButtonContext.value === false) {
                        throw new StopError();
                      }
                    };
                    class StopError extends Error {}
                    try {
                      showBigStopButtonContext.value = true;
                      for (let i = 0; i < continueTimes.value; i++) {
                        loading.value = true;
                        checkShouldStop();
                        await getBrowserState();
                        checkShouldStop();
                        await insertActions(actions);
                        checkShouldStop();
                        actionsContext.value++;
                        approved.value = true;
                        await runAndSave(
                          (await getActions()).map((action) => action.action)
                        );
                        checkShouldStop();
                        browserStateContext.value++;
                        const newValue = await getCompletionContext();
                        checkShouldStop();
                        actions = parseTextToResponse(newValue)!.actions;
                      }
                    } catch (err) {
                      if (err instanceof StopError) {
                        // Stopped
                      } else {
                        throw err;
                      }
                    } finally {
                      showBigStopButtonContext.value = false;
                      loading.value = false;
                    }
                  }}
                >
                  Continue
                </button>
                <input
                  type="number"
                  class="w-[53px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow pr-0 ml-[-19px] rounded-l-none"
                  value={continueTimes.value}
                  onInput$={(_e, el) => {
                    continueTimes.value = el.valueAsNumber;
                  }}
                />{" "}
                <div class="self-center ml-[-10px]">times</div>
                <button
                  class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
                  onClick$={async () => {
                    loading.value = true;
                    await insertActions(response!.actions);
                    loading.value = false;
                    actionsContext.value++;
                    approved.value = true;
                  }}
                >
                  Approve
                </button>
              </div>
            )}
          </>
        ) : (
          <pre class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500 overflow-auto">
            {props.response}
          </pre>
        )}
      </div>
    </>
  );
});
