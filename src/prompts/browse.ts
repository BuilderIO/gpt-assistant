import { getWebsiteContents } from "~/functions/get-website-contents";

const previousSteps = `
loadWebsite("https://www.opentable.com")
`.trim();

const prompt = `
Book me a table at Dosa in San Francisco for 2 people at 7pm on 10/22/2023
`;

const actions = `
The actions you can take:
- load a website, like loadWebsite("https://www.google.com")
- click something, like: click(".selector")
- input something, like: input(".selector", "text")
`.trim();

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
${await getWebsiteContents("https://www.opentable.com")}

What will the one next action you will take be, from the actions provided above? Please answer with only 1 next step. And use the functions above, like:
click("#some-button")

`
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
