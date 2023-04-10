export async function getBrowsePrompt() {
  return `

You browse the web based on a prompt.

You were previously asked to do the following task:
Do a google search

The previous steps you did:
- loadWebsite("https://www.google.com")

The actions you can take:
- click something, like: click(".selector")
- input something, like: input(".selector", "text")

The current website content is:
<form>
  <input name="q" type="text" />
  <button>Search</button>
</form>

The prompt is: do a google search for dogs

What will the one next action you will take be, from the actions provided above? Please answer with only 1 next step. And use the functions above, like:
click("#some-button")

`.trim();
}
