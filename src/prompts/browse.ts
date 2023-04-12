import { server$ } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { getActionsWithoutId } from "~/components/actions/actions";

const getPreviousSteps = async () =>
  `
${JSON.stringify(await getActionsWithoutId())}
`.trim();

export const getBrowserState = server$(async () => {
  const prisma = new PrismaClient();
  const browserState = await prisma.browserState.findFirst();
  return browserState;
});

export const websiteContents = async () => {
  const browserState = await getBrowserState();
  if (browserState) {
    `
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
const includeThought = true;

export async function getBrowsePrompt() {
  const previousSteps = await getPreviousSteps();
  return `

You browse the web based and take actions in a web browser based on a prompt.

${
  previousSteps.length
    ? `
The previous steps you took were:
${previousSteps}
`.trim()
    : ""
}

The prompt is: ${await getPrompt()}

${actions}

What will the next actions you will take be, from the actions provided above? Using the functions above, give me a list of actions to take next, as a JSON array like:
{"actions":[{"action":"navigate","url":"https://www.a-website.com"}${
    useOnlyOneAction
      ? ""
      : `
{"action":"input","text":"A search"},
{"action":"click","selector":"#some-button"}`
  }]${includeThought ? `,"thought":"I need to do a thing"` : ""}}

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
