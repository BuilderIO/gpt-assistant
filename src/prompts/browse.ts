import { server$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { getActionsWithoutId } from "~/components/actions/actions";
import type { BrowserStateSafeType } from "~/components/browser-state/browser-state";

const getPreviousSteps = async () =>
  `
${JSON.stringify(await getActionsWithoutId())}
`.trim();

export const getBrowserState = server$(
  async (): Promise<BrowserStateSafeType | null> => {
    const prisma = new PrismaClient();
    const browserState = await prisma.browserState.findFirst();
    return browserState
      ? {
          ...browserState,
          id: String(browserState.id),
        }
      : null;
  }
);

const websiteContents = async () => {
  const browserState = await getBrowserState();
  if (browserState) {
    return `
The current website content is:
${browserState.html}
    `.trim();
  }
  return "";
};

export const getPrompt = server$(async () => {
  const prisma = new PrismaClient();
  const prompt = await prisma.prompt.findFirst({});
  return prompt?.text;
});

const actions = `
The actions you can take:
- load a website, like: {"action":"navigate","url":"https://www.google.com"}
- click something, like: {"action":"click","selector":"#some-button"}
- input something, like: {"action":"input","selector":"#some-input","text":"some text"}
- ask a question to the user to get information you require that was not yet provided, like: {"action":"ask","question":"What is your name?"}
- terminate the program, like: {"action":"terminate","reason":"The restaurant you wanted is not available"}
`.trim();

const useOnlyOneAction = true;
const includeThought = false;

export async function getBrowsePrompt() {
  const previousSteps = await getPreviousSteps();
  return `

You browse the web based and take actions in a web browser based on a prompt.

${
  previousSteps.length > 4
    ? `
The previous steps you took were:
${previousSteps}
`.trim()
    : ""
}

${await websiteContents()}

The prompt is: ${await getPrompt()}

${actions}

What will the next action${
    useOnlyOneAction ? "" : "s"
  } you will take be, from the actions provided above? Using the functions above, give me a ${
    useOnlyOneAction ? "single action" : "list of actions"
  } to take next, like:
${includeThought ? '{"actions":' : ""}${
    useOnlyOneAction ? "" : "["
  }{"action":"navigate","url":"https://www.a-website.com"}${
    useOnlyOneAction
      ? ""
      : `
{"action":"input","text":"A search"},
{"action":"click","selector":"#some-button"}]`
  }${includeThought ? `,"thought":"I need to do a thing"}` : ""}

${
  includeThought
    ? `For the thought field, print a "thought", that describes what you need to do and why you are taking those actions, on a new line.`
    : ""
}

${useOnlyOneAction ? `Please only output one next action` : ""}

`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
