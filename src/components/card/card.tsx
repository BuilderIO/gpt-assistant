import { Slot, component$ } from "@builder.io/qwik";

export const Card = component$(() => {
  return (
    <div class="flex flex-col px-8 py-6 space-y-4 bg-white rounded-md shadow-md">
      <Slot />
    </div>
  );
});
