import { server$ } from '@builder.io/qwik-city';
import { getActionsWithoutId } from '~/components/actions/actions';
import { prismaClient } from '~/constants/prisma-client';
import { plugins } from '~/plugins';
import { removeNthQueryParams } from '../functions/remove-nth-query-params';
import { BrowserState } from '@prisma/client';

const getPreviousSteps = async () =>
  `
${JSON.stringify(await getActionsWithoutId())}
`.trim();

const getPluginActions = server$(() => {
  if (!plugins.length) {
    return '';
  }
  return plugins
    .map((plugin) => plugin.actions)
    .flat()
    .map((action) => {
      return `- ${action.description}, like: ${JSON.stringify({
        action: action.name,
        ...action.example,
      })}`;
    })
    .join('\n');
});

export const getBrowserState = server$(
  async (): Promise<BrowserState | null> => {
    const browserState = await prismaClient!.browserState.findFirst();
    return browserState;
  }
);

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
  return '';
};

export const getPrompt = server$(async () => {
  const prompt = await prismaClient!.prompt.findFirst({});
  return prompt?.text;
});

const includeAsk = true;

const getActions = async () =>
  `
The actions you can take:
- load a website, like: {"action":"browser.navigate","url":"https://www.google.com"}
- click something on the website, like: {"action":"browser.click","selector":"#some-button"}
- input something on the website, like: {"action":"browser.input","selector":"#some-input","text":"some text"}${
    !includeAsk
      ? ''
      : `
- ask a question to the user to get information you require that was not yet provided, like: {"action":"ask","question":"What is your name?"}`
  }
- terminate the program, like: {"action":"terminate","reason":"The restaurant you wanted is not available"}
${await getPluginActions()}

When you provide a selector, be sure that that selector is actually on the current page you are on. It needs to be in the HTML you are provided or don't use it.
When providing a shell command, be sure not to use any interactive commands, provide all options upfront.
`.trim();

const getAnswers = server$(async () => {
  const answers = await prismaClient!.answers.findMany();
  const newAnswers = answers.map((answer) => ({
    question: answer.question,
    answer: answer.answer,
  }));
  return newAnswers;
});

async function priorAnswers() {
  const answers = await getAnswers();

  if (!answers.length) {
    return '';
  }
  return `
The answers to previous questions you asked are:
${JSON.stringify(answers)}
`;
}

export async function getBrowsePrompt() {
  const previousSteps = await getPreviousSteps();
  return `

You are an assitant that takes actions based on a prompt.

The prompt is: ${await getPrompt()}

${await websiteContents()}

${await getActions()}

${
  previousSteps.length > 4
    ? `
The previous actions you took were:
${previousSteps}
`.trim()
    : ''
}

${await priorAnswers()}

What will the next action you will take be, from the actions provided above? Using the functions above, give me a single action to take next, like:
{"action":"some.action","optionName":"optionValue"}

If an action isn't explicitly listed here, it doesn't exist.

Please only output one next action:
`
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
