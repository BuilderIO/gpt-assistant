import type { Plugin } from '.';

export default (options: { username: string; password: string }) =>
  ({
    name: 'github',
    actions: [
      {
        name: 'github.openRepo',
        description: 'Open a GitHub repo',
        example: {
          name: 'builder',
        },
        handler: async ({ action: { name }, page }) => {
          await page.goto('https://github.com/search');
          await page.type('input[name=q]', name);
          await page.click('#search_form button[type=submit]');
          await page.waitForNavigation();
          await page.click(`.repo-list a`);
          await page.waitForNavigation();
        },
      },
      {
        name: 'github.login',
        description: 'Log in to github',
        handler: async ({ page }) => {
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
        name: 'github.editCurrentFile',
        example: {
          newContent: "console.log('hello world')",
        },
        description: 'Edit the currently open file',
        handler: async ({ action: { newContent }, page }) => {
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
