import type { Page } from 'puppeteer';
import github from './github';

export type PluginAction<
  T extends Record<string, string | number>,
  Name extends string
> = {
  name: Name;
  description: string;
  example?: T;
  handler: (info: { action: T & { action: Name }; page: Page }) => Promise<void>;
};

export type Plugin = {
  name: string;
  actions: PluginAction<any, any>[];
};

export const plugins: Plugin[] = [
  github({
    username: process.env.GITHUB_USERNAME! || 'testuser',
    password: process.env.GITHUB_PASSWORD! || 'testpassword',
  }),
];
