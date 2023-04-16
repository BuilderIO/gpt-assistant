import type { Plugin } from '.';
import { execaCommand } from 'execa';

// const basePath = process.env.FS_BASE_PATH || `${process.cwd()}/working-dir`;

export default () =>
  ({
    name: 'exec',
    actions: [
      {
        name: 'exec.shell',
        description: 'Execute a bash command',
        example: {
          command: 'cat ./foo.txt',
        },
        handler: async ({ action: { command } }) => {
          const out = await execaCommand(command, {
            stdio: 'inherit',
            shell: process.env.SHELL || true,
          });
          return out.all;
        },
      },
    ],
  } satisfies Plugin);
