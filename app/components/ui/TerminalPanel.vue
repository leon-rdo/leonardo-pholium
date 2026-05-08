<script setup lang="ts">
/**
 * Mock terminal card. Renders a macOS-style title bar with traffic lights
 * and a slot for prompt lines.
 *
 * Example:
 *   <TerminalPanel title="~/leonardo · whoami.sh">
 *     <TerminalLine prompt="$" cmd="whoami" out="leonardo · backend engineer" />
 *   </TerminalPanel>
 */
withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: '~/leonardo · whoami.sh' },
);
</script>

<template>
  <!--
    Terminal stays "always dark" — uses bg-night / text-night-text so the
    surface doesn't flip in dark mode (as bg-ink/text-paper would).
  -->
  <div class="rounded-tile overflow-hidden bg-night text-night-text ring-hair">
    <div
      class="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/10 bg-black/20"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-white/15" />
      <span class="w-2.5 h-2.5 rounded-full bg-white/10" />
      <span class="w-2.5 h-2.5 rounded-full bg-white/5" />
      <span
        class="ml-3 font-mono text-[11px] tracking-[0.12em] uppercase text-night-text/50"
        >{{ title }}</span
      >
    </div>
    <div class="p-4 font-mono text-[12.5px] leading-[1.7]">
      <slot />
    </div>
  </div>
</template>
