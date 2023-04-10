import type { PropFunction } from "@builder.io/qwik";
import { Fragment, component$ } from "@builder.io/qwik";
import { Question } from "../question/question";

interface TextBlock {
  type: "text";
  text: string;
}

interface QuestionBlock {
  type: "question";
  question: string;
  isPartial?: boolean;
}

type Block = TextBlock | QuestionBlock;

function parseTextToBlocks(text: string): Block[] {
  const blocks: Block[] = [];

  for (const line of text.split("\n")) {
    const useLine = line.trim();
    if (line.startsWith("ask(")) {
      blocks.push({
        type: "question",
        question: useLine.trim().slice(5, -2),
        isPartial: !useLine.endsWith(")"),
      });
    } else {
      blocks.push({
        type: "text",
        text: line,
      });
    }
  }

  return blocks;
}

export const RenderResult = component$(
  (props: { response: string; onUpdate: PropFunction<() => void> }) => {
    const blocks = parseTextToBlocks(props.response);

    return (
      <>
        {blocks.map((block) => {
          if (block.type === "text") {
            return <Fragment key={block.text}>{block.text}</Fragment>;
          } else if (block.type === "question") {
            return (
              <Question
                onUpdate={props.onUpdate}
                key={block.question}
                isPartial={block.isPartial}
                question={block.question}
              />
            );
          }
        })}
      </>
    );
  }
);
