import type { Signal } from "@builder.io/qwik";
import { useContext, useSignal } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import { server$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import type { BrowserAction } from "~/functions/get-page-contents";
import { ActionsContext } from "~/routes";
import { Loading } from "../loading/loading";

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

function parseTextToResponse(text: string) {
  try {
    const result = JSON.parse(text) as ResponseBlock;
    // Sometime an array is returned
    if (Array.isArray(result)) {
      return {
        thought: "",
        actions: result as any,
      } satisfies ResponseBlock;
    }
    return result;
  } catch (err) {
    // That's ok
  }
}

const insertActions = server$(async (actions: BrowserAction[]) => {
  console.log("Reached server?");
  const prisma = new PrismaClient();
  await prisma.actions.createMany({
    data: actions.map((action) => ({
      data: action,
      workflow_id: "1",
    })),
  });
});

const RenderResponse = component$((props: { response: ResponseBlock }) => {
  const actionsContext = useContext(ActionsContext);
  const loading = useSignal(false);
  return (
    <>
      {props.response.thought && <p>{props.response.thought}</p>}
      <pre class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
        {JSON.stringify(props.response.actions, null, 2)}
      </pre>
      {loading.value ? (
        <Loading />
      ) : (
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 border border-blue-700 rounded"
          onClick$={async () => {
            loading.value = true;
            await insertActions(props.response.actions);
            loading.value = false;
            actionsContext.value++;
          }}
        >
          Approve Actions
        </button>
      )}
    </>
  );
});

export const RenderResult = component$((props: { response: string }) => {
  const response = parseTextToResponse(props.response);

  return (
    <>
      {response ? (
        <RenderResponse response={response} />
      ) : (
        <pre class="whitespace-pre-wrap w-full p-2 bg-gray-100 border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-500">
          {props.response}
        </pre>
      )}
    </>
  );
});
