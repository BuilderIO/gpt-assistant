import type { Plugin } from '.';

class NoPageError extends Error {
  constructor(message?: string) {
    super(message || 'No active browser page found');
  }
}

export default (options: { username: string; password: string }) =>
  ({
    name: 'github',
    requires: ['browser'],
    actions: [
      {
        name: 'browser.github.openRepo',
        description: 'Open a GitHub repo in the browser',
        example: {
          name: 'builder',
        },
        handler: async ({ action: { name }, context: { page } }) => {
          if (!page) {
            throw new NoPageError();
          }
          await page.goto('https://github.com/search');
          await page.type('input[name=q]', name);
          await page.click('#search_form button[type=submit]');
          await page.waitForNavigation();
          await page.click(`.repo-list a`);
          await page.waitForNavigation();
        },
      },
      {
        name: 'browser.github.login',
        description: 'Log in to github in the browser',
        handler: async ({ context: { page } }) => {
          if (!page) {
            throw new NoPageError();
          }
          await page.goto('https://github.com/login');

          // We are logged in already
          if ((await page.$('input[name=login]')) === null) {
            return;
          }

          await page.type('input[name=login]', options.username);
          await page.type('input[name=password]', options.password);
          await page.click('input[type=submit]');
          await page.waitForNavigation();
          await page.evaluate(() => {
            alert('Enter your 2fa code');
          });
          // wait for 2fa code
          await page.waitForNavigation({
            timeout: 1000 * 60 * 5,
          });
        },
      },
      {
        name: 'browser.github.editCurrentFile',
        example: {
          newContent: "console.log('hello world')",
        },
        description: 'Edit the currently open file in the browser',
        handler: async ({ action: { newContent }, context: { page } }) => {
          if (!page) {
            throw new NoPageError();
          }
          const editbutton = await page.$(
            '[title="Edit this file"],[aria-label="Edit this file"]'
          );
          if (editbutton) {
            await editbutton.click();
            await page.waitForNavigation();
          }
          await page.waitForSelector('.CodeMirror');
          await page.type('.CodeMirror-code', newContent);
        },
      },
    ],
  } satisfies Plugin);
