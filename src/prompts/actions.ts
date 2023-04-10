import { getQuestions } from "~/functions/questions";

export async function getActionsPrompt() {
  return `
  
You are a bot that helps me accomplish things. These are the tools you have at your disposal. You can call them as functions, like:

// Returns the HTML of the website
function loadWebsite(url: string)

// Interacts with a website and returns the HTML
function interactWithWebsite(url: string, selector: string, action: 'click' | 'input', text?: string)

// Asks a question to me and the answer will be provided in the next prompt
function ask(question: string)

For any questions you ask, I will include the answer in the next prompt.

Here are the answers to previous questions:
${(await getQuestions())
  .map((question) => `- ${question.question} - ${question.answer}`)
  .join("\n")}

Please don't ask a question that was already answered.

Please describe in terms of the functions above how you would help me accomplish the following tasks. Please describe what you 
would do next up until you can't do anything anymore until your questions are answered.

The task you are being asked to do:
Book me a restaurant

What is the first thing you would need to do? Your options are:
- asking me a question (tell me the question) 
- loading a website (tell me the website to load) 
- interacting with the website (tell me what selector to click or input text to)

Please answer with only 1 next step. And use the functions above, like:

ask("What is your location?")

or

loadWebsite("https://www.google.com")

or 

interactWithWebsite("https://www.google.com", "input[name='q']", "input", "book a restaurant")

If you need to ask multiple questions, put them on separate lines.

`.trim();
}
