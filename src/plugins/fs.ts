import type { Plugin } from '.';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, relative } from 'path';
import { glob } from 'glob';

const basePath = process.env.FS_BASE_PATH || `~/Desktop/gpt-assistant`;

function getRealFilePath(path: string) {
  return join(basePath, path);
}

function getDiplayFilePath(path: string) {
  return relative(basePath, path);
}

async function outputFile(path: string, contents: string) {
  const dirPath = dirname(path);
  try {
    await access(dirPath);
  } catch (error) {
    await mkdir(dirPath, { recursive: true });
  }
  await writeFile(path, contents);
}

export default () =>
  ({
    name: 'fs',
    actions: [
      {
        name: 'fs.readFile',
        description: 'Read a file',
        example: {
          path: './foo.txt',
        },
        handler: async ({ action: { path } }) => {
          try {
            const contents = await readFile(getRealFilePath(path), 'utf8');
            return contents;
          } catch (err) {
            console.warn(err);
            return null;
          }
        },
      },
      {
        name: 'fs.writeFile',
        description: 'Write a file',
        example: {
          path: './foo/bar.txt',
          contents: 'hello world',
        },
        handler: async ({ action: { path, contents } }) => {
          await outputFile(getRealFilePath(path), contents);
        },
      },
      {
        name: 'fs.listFiles',
        description: 'List files',
        example: {
          path: '**/*.txt',
        },
        handler: async ({ action: { path } }) => {
          const files = await glob(path, {
            cwd: basePath,
            ignore: ['**/node_modules/**'],
          });
          return files.map((path) => getDiplayFilePath(path)).join('\n');
        },
      },
    ],
  } satisfies Plugin);
