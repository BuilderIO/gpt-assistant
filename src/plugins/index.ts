import type { Page } from 'puppeteer';
// import github from './github';
import exec from './exec';

type PluginContext = {
  page?: Page;
};

export type PluginAction<
  T extends Record<string, string | number>,
  Name extends string
> = {
  name: Name;
  description: string;
  example?: T;
  handler: (info: {
    action: T & { action: Name };
    context: PluginContext;
  }) => Promise<string | void | null>;
};

export type Plugin = {
  name: string;
  requires?: string[];
  promptInfo?: string;
  actions: PluginAction<any, any>[];
};

export const plugins: Plugin[] = [exec()].filter(Boolean);
