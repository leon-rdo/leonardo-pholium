<script setup lang="ts">
const email = ref('');
const isSubmitting = ref(false);
const subscribed = ref(false);
const error = ref('');

const subscribe = async () => {
    if (!email.value || !email.value.includes('@')) {
        error.value = 'Por favor, insira um e-mail válido';
        return;
    }

    isSubmitting.value = true;
    error.value = '';

    try {
        // TODO: Implement your newsletter subscription API call here
        // await $fetch('/api/newsletter/subscribe/', {
        //   method: 'POST',
        //   body: { email: email.value }
        // });

        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        subscribed.value = true;
        email.value = '';
    } catch (err) {
        error.value = 'Erro ao se inscrever. Tente novamente.';
        console.error('Newsletter subscription error:', err);
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="newsletter-subscribe">
        <div v-if="!subscribed" class="newsletter-content">
            <div class="newsletter-icon">
                <v-icon size="48" color="primary">mdi-email-newsletter</v-icon>
            </div>

            <h3 class="newsletter-title">Receba novos artigos</h3>
            <p class="newsletter-description">
                Inscreva-se para receber notificações sobre novos posts e conteúdos exclusivos
            </p>

            <form @submit.prevent="subscribe" class="newsletter-form">
                <v-text-field v-model="email" type="email" placeholder="seu@email.com" variant="outlined"
                    density="comfortable" hide-details :error="!!error" class="newsletter-input">
                    <template v-slot:append-inner>
                        <v-btn type="submit" color="primary" :loading="isSubmitting" :disabled="isSubmitting" icon flat>
                            <v-icon>mdi-arrow-right</v-icon>
                        </v-btn>
                    </template>
                </v-text-field>

                <p v-if="error" class="error-message">{{ error }}</p>
            </form>

            <p class="newsletter-privacy">
                <v-icon size="14">mdi-lock</v-icon>
                Seus dados estão seguros. Sem spam, prometido!
            </p>
        </div>

        <div v-else class="newsletter-success">
            <v-icon size="64" color="success">mdi-check-circle</v-icon>
            <h3 class="success-title">Inscrição confirmada!</h3>
            <p class="success-description">
                Obrigado por se inscrever. Você receberá nossos próximos artigos no seu e-mail.
            </p>
        </div>
    </div>
</template>

<style scoped>
.newsletter-subscribe {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    padding: 48px 40px;
    border-radius: 16px;
    color: white;
    text-align: center;
}

.newsletter-content {
    max-width: 500px;
    margin: 0 auto;
}

.newsletter-icon {
    margin-bottom: 24px;
}

.newsletter-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 12px;
    color: white;
}

.newsletter-description {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 32px;
    color: rgba(255, 255, 255, 0.9);
}

.newsletter-form {
    margin-bottom: 16px;
}

.newsletter-input {
    background: white;
    border-radius: 12px;
}

.newsletter-input :deep(.v-field) {
    border-radius: 12px;
}

.newsletter-input :deep(.v-field__input) {
    padding: 12px 16px;
}

.error-message {
    color: #fef2f2;
    font-size: 0.875rem;
    margin-top: 8px;
    text-align: left;
}

.newsletter-privacy {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

/* Success State */
.newsletter-success {
    max-width: 400px;
    margin: 0 auto;
    animation: fadeIn 0.5s ease;
}

.success-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 24px 0 12px;
    color: white;
}

.success-description {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 600px) {
    .newsletter-subscribe {
        padding: 40px 24px;
    }

    .newsletter-title {
        font-size: 1.5rem;
    }

    .newsletter-description {
        font-size: 0.9375rem;
    }
}
</style>