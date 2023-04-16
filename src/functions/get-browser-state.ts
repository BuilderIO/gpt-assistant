import { server$ } from '@builder.io/qwik-city';
import type { BrowserState } from '@prisma/client';
import { prismaClient } from '~/constants/prisma-client';

export const getBrowserState = server$(
  async (): Promise<BrowserState | null> => {
    const browserState = await prismaClient!.browserState.findFirst();
    return browserState;
  }
);
