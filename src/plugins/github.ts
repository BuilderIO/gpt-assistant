import type { Plugin } from '.';

export default (options: { username: string; password: string }) =>
  ({
    name: 'github',
    actions: [
      {
        name: 'openRepo',
        description: 'Open a GitHub repo',
        example: {
          name: 'builder',
        },
        handler: async ({ action: { name }, page }) => {
          await page.goto('https://github.com/search');
          await page.type('input[name=q]', name);
          await page.click('button[type=submit]');
          await page.waitForNavigation();
          await page.click(`.repo-list a`);
          await page.waitForNavigation();
        },
      },
      {
        name: 'login',
        description: 'Log in to github',
        handler: async ({ page }) => {
          await page.goto('https://github.com/login');
          await page.type('input[name=login]', options.username);
          await page.type('input[name=password]', options.password);
          await page.click('input[type=submit]');
          await page.waitForNavigation();
        },
      },
    ],
  } satisfies Plugin);
