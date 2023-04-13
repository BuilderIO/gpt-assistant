import { server$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';

const workflowId = 'test';

export const addQuestion = server$(
  async (question: string, answer: string, workflow = workflowId) => {
    const prisma = new PrismaClient();

    return await prisma.answers.create({
      data: {
        question,
        answer,
        workflow_id: workflow,
      },
    });
  }
);

export const getQuestions = server$(async (workflow = workflowId) => {
  const prisma = new PrismaClient();

  return await prisma.answers.findMany({
    where: {
      workflow_id: workflow,
    },
  });
});
