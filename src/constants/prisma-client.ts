import { PrismaClient } from '@prisma/client';
import { isServer } from '@builder.io/qwik/build';

export const prismaClient = isServer ? new PrismaClient() : null;
