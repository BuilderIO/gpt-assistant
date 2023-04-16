import type { Plugin } from '.';
import { execaCommand } from 'execa';

// const basePath = process.env.FS_BASE_PATH || `${process.cwd()}/working-dir`;

export default () =>
  ({
    name: 'exec',
    promptInfo: `
When providing a shell command, be sure not to use any interactive commands, provide all options upfront.
Do not run any servers, for instance do not run "npm run dev".
Do all reads and writes to files (such as for code) using the shell. Do not launch an IDE or code editor.
Use the directory ./working-dir as your root directory for all file reads and writes.
`.trim(),
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
          }).catch((err) => err);
          return out?.all;
        },
      },
    ],
  } satisfies Plugin);
