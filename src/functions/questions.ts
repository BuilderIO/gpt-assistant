import { server$ } from '@builder.io/qwik-city';
import { prismaClient } from '~/constants/prisma-client';

const workflowId = 'test';

export const addQuestion = server$(
  async (question: string, answer: string, workflow = workflowId) => {
    return await prismaClient!.answers.create({
      data: {
        question,
        answer,
        workflow_id: workflow,
      },
    });
  }
);

export const getQuestions = server$(async (workflow = workflowId) => {
  return await prismaClient!.answers.findMany({
    where: {
      workflow_id: workflow,
    },
  });
});
