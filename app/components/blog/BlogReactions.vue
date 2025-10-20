<script setup lang="ts">
import type { ReactionSummary } from '~/types/blog';

const props = defineProps<{
    postId: number;
}>();

const config = useRuntimeConfig();
const { locale, t } = useI18n();

// Fetch reaction summary
const { data: reactionSummary, refresh: refreshReactions } = await useFetch<ReactionSummary>(
    `/api/blog/post-reactions/summary/${props.postId}/`,
    {
        baseURL: config.public.apiBase,
        headers: {
            'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us'
        }
    }
);

const reactionIcons = {
    like: 'mdi-thumb-up',
    love: 'mdi-heart',
    clap: 'mdi-hand-clap',
    fire: 'mdi-fire',
    wow: 'mdi-emoticon-excited'
};

const isAuthenticated = ref(false); // You should implement proper auth check
const isLoading = ref(false);

const toggleReaction = async (reactionType: string) => {
    if (!isAuthenticated.value) {
        // Redirect to login or show auth modal
        alert('Você precisa estar logado para reagir');
        return;
    }

    isLoading.value = true;

    try {
        await $fetch('/api/blog/post-reactions/toggle/', {
            baseURL: config.public.apiBase,
            method: 'POST',
            headers: {
                'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us',
                // Add authorization header here
            },
            body: {
                post: props.postId,
                reaction: reactionType
            }
        });

        await refreshReactions();
    } catch (error) {
        console.error('Error toggling reaction:', error);
    } finally {
        isLoading.value = false;
    }
};

const getReactionCount = (type: string) => {
    return reactionSummary.value?.reactions?.[type] || 0;
};
</script>

<template>
    <div class="blog-reactions">
        <h3 class="reactions-title">{{ t('blog.reactToArticle') }}</h3>

        <div class="reactions-grid">
            <button v-for="(icon, type) in reactionIcons" :key="type" class="reaction-button" :disabled="isLoading"
                @click="toggleReaction(type)" :title="t(`reactions.${type}`)">
                <v-icon :icon="icon" size="28" class="reaction-icon" />
                <span class="reaction-count">{{ getReactionCount(type) }}</span>
                <span class="reaction-label">{{ t(`reactions.${type}`) }}</span>
            </button>
        </div>

        <div v-if="reactionSummary?.total" class="reactions-summary">
            <span class="reactions-total">
                {{ t('blog.reactions', { count: reactionSummary.total }) }}
            </span>
        </div>
    </div>
</template>

<style scoped>
.blog-reactions {
    padding: 40px 0;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
}

.reactions-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24px;
    text-align: center;
}

.reactions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.reaction-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.reaction-button:hover:not(:disabled) {
    border-color: #2563eb;
    background: #f9fafb;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.1);
}

.reaction-button:active:not(:disabled) {
    transform: translateY(-2px);
}

.reaction-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.reaction-icon {
    color: #6b7280;
    transition: color 0.3s ease;
}

.reaction-button:hover:not(:disabled) .reaction-icon {
    color: #2563eb;
}

.reaction-count {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1a1a1a;
}

.reaction-label {
    font-size: 0.75rem;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.reactions-summary {
    text-align: center;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
}

.reactions-total {
    font-size: 0.9375rem;
    color: #6b7280;
    font-weight: 500;
}

/* Responsive */
@media (max-width: 600px) {
    .reactions-grid {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 12px;
    }

    .reaction-button {
        padding: 16px 12px;
    }

    .reaction-icon {
        font-size: 24px !important;
    }

    .reaction-count {
        font-size: 1rem;
    }

    .reaction-label {
        font-size: 0.625rem;
    }
}
</style>
