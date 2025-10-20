<script setup lang="ts">
import type { DjangoListResponse } from '~/types/api';
import type { Comment } from '~/types/blog';

const { t } = useI18n();
const props = defineProps<{
  postId: number;
}>();

const config = useRuntimeConfig();
const { locale } = useI18n();

const isAuthenticated = ref(false);
const isSubmitting = ref(false);
const replyingTo = ref<number | null>(null);

// Comment form data
const newComment = ref({
  content: '',
  guest_name: '',
  guest_email: '',
  guest_website: ''
});

// Fetch comments
const { data: commentsData, refresh: refreshComments } = await useFetch<DjangoListResponse<Comment>>(
  '/api/blog/comments/',
  {
    baseURL: config.public.apiBase,
    params: {
      post: props.postId,
      ordering: 'created_at'
    },
    headers: {
      'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us'
    }
  }
);

// Organize comments into threads
const organizedComments = computed(() => {
  const comments = commentsData.value?.results || [];
  const commentMap = new Map<number, Comment & { replies: Comment[] }>();
  const rootComments: (Comment & { replies: Comment[] })[] = [];

  // First pass: create map with replies array
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into threads
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id);
    if (!commentWithReplies) return;

    if (comment.parent) {
      const parent = commentMap.get(comment.parent);
      if (parent) {
        parent.replies.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
});

const formatDate = (date: string) => {
  const commentDate = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

  return commentDate.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const submitComment = async (parentId: number | null = null) => {
  if (!newComment.value.content.trim()) {
    alert('Por favor, escreva um comentário');
    return;
  }

  if (!isAuthenticated.value) {
    if (!newComment.value.guest_name.trim() || !newComment.value.guest_email.trim()) {
      alert(t('blog.fillGuestInfo'));
      return;
    }
  }

  isSubmitting.value = true;

  try {
    await $fetch('/api/blog/comments/', {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: {
        'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us',
        // Add authorization header if authenticated
      },
      body: {
        post: props.postId,
        parent: parentId,
        content: newComment.value.content,
        ...((!isAuthenticated.value) && {
          guest_name: newComment.value.guest_name,
          guest_email: newComment.value.guest_email,
          guest_website: newComment.value.guest_website
        })
      }
    });

    // Reset form
    newComment.value = {
      content: '',
      guest_name: '',
      guest_email: '',
      guest_website: ''
    };
    replyingTo.value = null;

    await refreshComments();
  } catch (error) {
    console.error('Error submitting comment:', error);
    alert('Erro ao enviar comentário. Tente novamente.');
  } finally {
    isSubmitting.value = false;
  }
};

const startReply = (commentId: number) => {
  replyingTo.value = commentId;
};

const cancelReply = () => {
  replyingTo.value = null;
  newComment.value.content = '';
};
</script>

<template>
  <div class="blog-comments">
    <h3 class="comments-title">
      {{ t('blog.comments') }} ({{ commentsData?.count || 0 }})
    </h3>

    <!-- Comment Form -->
    <div class="comment-form-wrapper">
      <h4 class="comment-form-title">{{ t('blog.leaveComment') }}</h4>

      <form @submit.prevent="submitComment(null)" class="comment-form">
        <!-- Guest Info (if not authenticated) -->
        <div v-if="!isAuthenticated" class="guest-fields">
          <v-text-field v-model="newComment.guest_name" :label="t('blog.guestName')" variant="outlined"
            density="comfortable" hide-details required />
          <v-text-field v-model="newComment.guest_email" :label="t('blog.guestEmail')" type="email" variant="outlined"
            density="comfortable" hide-details required />
          <v-text-field v-model="newComment.guest_website" :label="t('blog.guestWebsite')" variant="outlined"
            density="comfortable" hide-details />
        </div>

        <!-- Comment Content -->
        <v-textarea v-model="newComment.content" :label="t('blog.yourComment')" variant="outlined" rows="4" hide-details
          required />

        <v-btn type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting" class="text-none">
          {{ t('blog.sendComment') }}
        </v-btn>
      </form>
    </div>

    <!-- Comments List -->
    <div v-if="organizedComments.length" class="comments-list">
      <div v-for="comment in organizedComments" :key="comment.id" class="comment-thread">
        <!-- Parent Comment -->
        <div class="comment">
          <div class="comment-avatar">
            <v-icon size="32" color="grey-lighten-1">mdi-account-circle</v-icon>
          </div>

          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">
                {{ comment.user ? 'Usuário' : comment.guest_name }}
              </span>
              <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            </div>

            <p class="comment-text">{{ comment.content }}</p>

            <div class="comment-actions">
              <button class="comment-action-btn" @click="startReply(comment.id)">
                <v-icon size="16">mdi-reply</v-icon>
                {{ t('blog.reply') }}
              </button>
            </div>

            <!-- Reply Form -->
            <div v-if="replyingTo === comment.id" class="reply-form-wrapper">
              <form @submit.prevent="submitComment(comment.id)" class="reply-form">
                <v-textarea v-model="newComment.content" label="Sua resposta" variant="outlined" rows="3" hide-details
                  auto-focus />

                <div class="reply-form-actions">
                  <v-btn type="submit" color="primary" size="small" :loading="isSubmitting" class="text-none">
                    {{ t('blog.submitReply') }}
                  </v-btn>
                  <v-btn variant="text" size="small" @click="cancelReply" class="text-none">
                    {{ t('blog.cancel') }}
                  </v-btn>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Replies -->
        <div v-if="comment.replies?.length" class="comment-replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="comment reply">
            <div class="comment-avatar">
              <v-icon size="28" color="grey-lighten-1">mdi-account-circle</v-icon>
            </div>

            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">
                  {{ reply.user ? 'Usuário' : reply.guest_name }}
                </span>
                <span class="comment-date">{{ formatDate(reply.created_at) }}</span>
              </div>

              <p class="comment-text">{{ reply.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="comments-empty">
      <v-icon size="60" color="grey-lighten-2">mdi-comment-outline</v-icon>
      <p class="comments-empty-text">
        {{ t('blog.beFirstToComment') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.blog-comments {
  padding: 40px 0;
}

.comments-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 32px;
}

/* Comment Form */
.comment-form-wrapper {
  background: #f9fafb;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 48px;
}

.comment-form-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guest-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* Comments List */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment {
  display: flex;
  gap: 16px;
}

.comment.reply {
  padding-left: 48px;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.9375rem;
}

.comment-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.comment-text {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 12px;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #6b7280;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.comment-action-btn:hover {
  color: #2563eb;
  background: #f3f4f6;
}

/* Reply Form */
.reply-form-wrapper {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-form-actions {
  display: flex;
  gap: 8px;
}

.comment-replies {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-left: 48px;
  padding-left: 16px;
  border-left: 2px solid #e5e7eb;
}

/* Empty State */
.comments-empty {
  text-align: center;
  padding: 60px 20px;
}

.comments-empty-text {
  font-size: 1rem;
  color: #9ca3af;
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 600px) {
  .comment-form-wrapper {
    padding: 24px;
  }

  .guest-fields {
    grid-template-columns: 1fr;
  }

  .comment.reply {
    padding-left: 24px;
  }

  .comment-replies {
    margin-left: 24px;
    padding-left: 12px;
  }

  .reply-form-wrapper {
    padding: 12px;
  }
}
</style>