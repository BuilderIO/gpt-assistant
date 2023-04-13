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

function removeNthQueryParams(url: string, n: number) {
  // Parse the URL using the URL constructor
  const parsedUrl = new URL(url);

  // Get the search parameters from the parsed URL
  const searchParams = parsedUrl.searchParams;

  // Convert the search parameters to an array of key-value pairs
  const paramsArray = Array.from(searchParams.entries());

  // Clear all existing search parameters
  searchParams.forEach((value, key) => {
    searchParams.delete(key);
  });

  // Add back only the first n query parameters
  for (let i = 0; i < Math.min(n, paramsArray.length); i++) {
    const [key, value] = paramsArray[i];
    searchParams.append(key, value);
  }

  return parsedUrl.href;
}

const websiteContents = async () => {
  const browserState = await getBrowserState();
  if (browserState) {
    return `
You are currently on the website: 
${removeNthQueryParams(browserState.url!, 2)} 
Which has this current HTML content:
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

const includeAsk = false;

const actions = `
The actions you can take:
- load a website, like: {"action":"navigate","url":"https://www.google.com"}
- click something, like: {"action":"click","selector":"#some-button"}
- input something, like: {"action":"input","selector":"#some-input","text":"some text"}${
  !includeAsk
    ? ""
    : `
- ask a question to the user to get information you require that was not yet provided, like: {"action":"ask","question":"What is your name?"}`
}
- terminate the program, like: {"action":"terminate","reason":"The restaurant you wanted is not available"}

When you provide a selector, be sure that that selector is actually on the current page you are on. It needs to be in the HTML you are provided or don't use it.
`.trim();

const useOnlyOneAction = true;
const includeThought = false;

const getAnswers = server$(async () => {
  const prisma = new PrismaClient();
  const answers = await prisma.answers.findMany();
  const newAnswers = answers.map((answer) => ({
    question: answer.question,
    answer: answer.answer,
  }));
  return newAnswers;
});

async function priorAnswers() {
  const answers = await getAnswers();

  if (!answers.length) {
    return "";
  }
  return `
The answers to previous questions you asked are:
${JSON.stringify(answers)}
`;
}

export async function getBrowsePrompt() {
  const previousSteps = await getPreviousSteps();
  return `

You browse the web and take actions in a web browser based on a prompt.

The prompt is: ${await getPrompt()}

${await websiteContents()}

${actions}

${
  previousSteps.length > 4
    ? `
The previous actions you took were:
${previousSteps}
`.trim()
    : ""
}

${await priorAnswers()}

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
