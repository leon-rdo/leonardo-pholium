<script setup lang="ts">
import { CornerUpLeft, MessageSquare, Send, User } from 'lucide-vue-next';
import type { DjangoListResponse } from '~/types/api';
import type { Comment } from '~/types/blog';

const props = defineProps<{ postId: number }>();

const config = useRuntimeConfig();
const { locale, t } = useI18n();

const isAuthenticated = ref(false);
const isSubmitting = ref(false);
const replyingTo = ref<number | null>(null);

const newComment = ref({
  content: '',
  guest_name: '',
  guest_email: '',
  guest_website: '',
});

const { data: commentsData, refresh: refreshComments } = await useFetch<
  DjangoListResponse<Comment>
>('/api/comments/', {
  baseURL: config.public.apiBase,
  params: { post: props.postId, ordering: 'created_at' },
  headers: { 'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us' },
});

// Two-pass thread organisation: build a map first, then attach replies
// to their parents. Anything without a `parent` field becomes a root.
const organizedComments = computed(() => {
  const comments = commentsData.value?.results || [];
  const map = new Map<number, Comment & { replies: Comment[] }>();
  const roots: (Comment & { replies: Comment[] })[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id);
    if (!node) return;
    if (c.parent) {
      const parent = map.get(c.parent);
      if (parent) parent.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
});

const formatDate = (date: string) => {
  const commentDate = new Date(date);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
  if (diffSec < 60) return t('blog.now');
  if (diffSec < 3600)
    return t('blog.minutesAgo', { count: Math.floor(diffSec / 60) });
  if (diffSec < 86400)
    return t('blog.hoursAgo', { count: Math.floor(diffSec / 3600) });
  if (diffSec < 604800)
    return t('blog.daysAgo', { count: Math.floor(diffSec / 86400) });
  return commentDate.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const submitComment = async (parentId: number | null = null) => {
  if (!newComment.value.content.trim()) return;
  if (
    !isAuthenticated.value &&
    (!newComment.value.guest_name.trim() ||
      !newComment.value.guest_email.trim())
  ) {
    return;
  }
  isSubmitting.value = true;
  try {
    await $fetch('/api/comments/', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: {
        post: props.postId,
        parent: parentId,
        content: newComment.value.content,
        ...(!isAuthenticated.value && {
          guest_name: newComment.value.guest_name,
          guest_email: newComment.value.guest_email,
          guest_website: newComment.value.guest_website,
        }),
      },
    });
    newComment.value = {
      content: '',
      guest_name: '',
      guest_email: '',
      guest_website: '',
    };
    replyingTo.value = null;
    await refreshComments();
  } catch (error) {
    console.error('Error submitting comment:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const inputClass =
  'w-full bg-paper text-ink placeholder:text-ink-4 ring-hair rounded-input ' +
  'px-4 py-2.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ' +
  'focus:ring-offset-card transition-shadow color-mode-fade ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';
</script>

<template>
  <section>
    <h3 class="h-display text-[24px] sm:text-[28px] font-bold mb-6">
      {{ $t('blog.comments') }}
      <span class="font-mono text-[14px] text-ink-3 align-middle ml-1">
        ({{ commentsData?.count || 0 }})
      </span>
    </h3>

    <!-- New comment form -->
    <Tile class="px-5 py-5 mb-10">
      <h4 class="font-mono-rail mb-4">{{ $t('blog.leaveComment') }}</h4>
      <form @submit.prevent="submitComment(null)" class="space-y-3">
        <div v-if="!isAuthenticated" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            v-model="newComment.guest_name"
            type="text"
            :placeholder="$t('blog.guestName')"
            required
            :disabled="isSubmitting"
            :class="inputClass"
          />
          <input
            v-model="newComment.guest_email"
            type="email"
            :placeholder="$t('blog.guestEmail')"
            required
            :disabled="isSubmitting"
            :class="inputClass"
          />
          <input
            v-model="newComment.guest_website"
            type="url"
            :placeholder="$t('blog.guestWebsite')"
            :disabled="isSubmitting"
            :class="inputClass"
          />
        </div>
        <textarea
          v-model="newComment.content"
          rows="4"
          required
          :disabled="isSubmitting"
          :placeholder="$t('blog.yourComment')"
          :class="inputClass + ' resize-y min-h-[110px]'"
        />
        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex items-center justify-center gap-2 bg-accent text-paper font-semibold px-5 py-2.5 rounded-input hover:bg-accent-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? $t('common.loading') : $t('blog.sendComment') }}
          <Send :size="14" :stroke-width="2" />
        </button>
      </form>
    </Tile>

    <!-- Comments list -->
    <ol v-if="organizedComments.length" class="space-y-7">
      <li
        v-for="comment in organizedComments"
        :key="comment.id"
        class="space-y-4"
      >
        <article class="flex gap-3">
          <div class="shrink-0 w-9 h-9 rounded-full bg-card-soft text-ink-3 grid place-items-center">
            <User :size="16" :stroke-width="1.6" />
          </div>
          <div class="flex-1 min-w-0">
            <header class="flex flex-wrap items-baseline gap-3">
              <span class="font-semibold text-[14.5px]">
                {{ comment.guest_name || $t('blog.guestName') }}
              </span>
              <span class="font-mono text-[11.5px] text-ink-3">
                {{ formatDate(comment.created_at) }}
              </span>
            </header>
            <p class="mt-2 text-[14.5px] text-ink-2 leading-[1.7] whitespace-pre-wrap">
              {{ comment.content }}
            </p>
            <div class="mt-2.5 flex items-center gap-4">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-[12.5px] font-medium text-ink-3 hover:text-accent transition-colors"
                @click="replyingTo = comment.id"
              >
                <CornerUpLeft :size="13" :stroke-width="1.8" />
                {{ $t('blog.reply') }}
              </button>
            </div>

            <!-- Reply form -->
            <form
              v-if="replyingTo === comment.id"
              class="mt-4 space-y-3"
              @submit.prevent="submitComment(comment.id)"
            >
              <textarea
                v-model="newComment.content"
                rows="3"
                required
                :placeholder="$t('blog.yourReply')"
                :class="inputClass + ' resize-y min-h-[80px]'"
              />
              <div class="flex items-center gap-2">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="inline-flex items-center gap-1.5 bg-accent text-paper text-[13px] font-semibold px-4 py-2 rounded-input hover:bg-accent-2 disabled:opacity-60 transition-colors"
                >
                  <Send :size="13" :stroke-width="2" />
                  {{ $t('blog.submitReply', $t('blog.sendComment')) }}
                </button>
                <button
                  type="button"
                  class="text-[13px] font-medium text-ink-3 hover:text-ink px-3 py-2 transition-colors"
                  @click="(replyingTo = null), (newComment.content = '')"
                >
                  {{ $t('blog.cancel') }}
                </button>
              </div>
            </form>
          </div>
        </article>

        <!-- Replies -->
        <ol v-if="comment.replies?.length" class="ml-12 pl-4 border-l border-line space-y-4">
          <li
            v-for="reply in comment.replies"
            :key="reply.id"
            class="flex gap-3"
          >
            <div class="shrink-0 w-8 h-8 rounded-full bg-card-soft text-ink-3 grid place-items-center">
              <User :size="14" :stroke-width="1.6" />
            </div>
            <div class="flex-1 min-w-0">
              <header class="flex flex-wrap items-baseline gap-3">
                <span class="font-semibold text-[14px]">
                  {{ reply.guest_name || $t('blog.guestName') }}
                </span>
                <span class="font-mono text-[11.5px] text-ink-3">
                  {{ formatDate(reply.created_at) }}
                </span>
              </header>
              <p class="mt-1.5 text-[14px] text-ink-2 leading-[1.7] whitespace-pre-wrap">
                {{ reply.content }}
              </p>
            </div>
          </li>
        </ol>
      </li>
    </ol>

    <div
      v-else
      class="flex flex-col items-center text-center py-12 text-ink-3"
    >
      <MessageSquare :size="40" :stroke-width="1.4" class="text-ink-4" />
      <p class="text-[15px] mt-3">{{ $t('blog.beFirstToComment') }}</p>
    </div>
  </section>
</template>
