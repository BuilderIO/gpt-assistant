import { getPageContents, parseActions } from "~/functions/get-page-contents";

const previousSteps = `
[{"action":"navigate","url":"https://www.opentable.com"},{"action":"input","selector":"#home-page-autocomplete-input","text":"Dosa in San Francisco"}, {"action":"click","selector":"#home-page-autocomplete-label"}, {"action":"click","selector":"[data-testid='day-picker-overlay']"}, {"action":"click","selector":"[aria-label='Sun, Oct 22, 2023']"}, {"action":"click","selector":"[data-testid='time-picker-overlay']"}, {"action":"click","selector":"[value='2000-02-01T19:00:00']"}, {"action":"click","selector":"[data-testid='party-size-picker-overlay']"}, {"action":"click","selector":"[value='2']"}, {"action":"click","selector":"button[type='button']"}]
`.trim();

const prompt = `
Book me a table at Dosa in San Francisco for 2 people at 7pm on 10/22/2023
`;

const actions = `
The actions you can take:
- load a website, like: {"action":"navigate","url":"https://www.google.com"}
- click something, like: {"action":"click","selector":"#some-button"}
- input something, like: {"action":"input","selector":"#some-input","text":"some text"}
- ask a question to the user to get information you require that was not yet provided, like: {"action":"ask","question":"What is your name?"}
`.trim();

const useOnlyOneAction = false;

export async function getBrowsePrompt() {
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

The prompt is: ${prompt}

${actions}

The current website content is:
${await getPageContents(
  "https://www.opentable.com",
  parseActions(previousSteps)
)}

What will the next actions you will take be, from the actions provided above?${
    useOnlyOneAction ? " Please answer with only 1 next step." : ""
  } Using the functions above, give me a list of actions to take next, as a JSON array like:
[{"action":"navigate","url":"https://www.opentable.com"},
{"action":"input","text":"A search"},
{"action":"click","selector":"#some-button"}]

`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
