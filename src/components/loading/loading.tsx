import { component$ } from "@builder.io/qwik";

export const Loading = component$(() => {
  return (
    <div class="flex justify-center items-center">
      <div class="border-t-4 border-b-4 border-gray-400 h-12 w-12 rounded-full animate-spin" />
    </div>
  );
});
