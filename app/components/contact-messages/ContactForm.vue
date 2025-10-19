<script setup lang="ts">
const config = useRuntimeConfig();
const { locale } = useI18n();

const form = ref({
    name: '',
    email: '',
    subject: '',
    message: ''
});

const isSubmitting = ref(false);
const submitted = ref(false);
const error = ref('');

const resetForm = () => {
    form.value = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };
    error.value = '';
};

const submitForm = async () => {
    if (!form.value.name || !form.value.email || !form.value.subject || !form.value.message) {
        error.value = 'Por favor, preencha todos os campos';
        return;
    }

    if (!form.value.email.includes('@')) {
        error.value = 'Por favor, insira um e-mail válido';
        return;
    }

    isSubmitting.value = true;
    error.value = '';

    try {
        await $fetch('/api/contact-messages/', {
            baseURL: config.public.apiBase,
            method: 'POST',
            headers: {
                'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us'
            },
            body: form.value
        });

        submitted.value = true;
        resetForm();

        // Reset success message after 5 seconds
        setTimeout(() => {
            submitted.value = false;
        }, 5000);
    } catch (err: any) {
        console.error('Contact form error:', err);
        error.value = err.data?.message || 'Erro ao enviar mensagem. Tente novamente.';
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="contact-form">
        <!-- Success Message -->
        <v-alert v-if="submitted" type="success" variant="tonal" class="mb-6">
            <strong>Mensagem enviada com sucesso!</strong>
            <br>
            Obrigado pelo contato. Responderei em breve.
        </v-alert>

        <!-- Error Message -->
        <v-alert v-if="error" type="error" variant="tonal" class="mb-6" closable @click:close="error = ''">
            {{ error }}
        </v-alert>

        <!-- Form -->
        <form @submit.prevent="submitForm" class="contact-form-fields">
            <v-row>
                <v-col cols="12" md="6">
                    <v-text-field v-model="form.name" label="Nome *" variant="outlined" density="comfortable"
                        :disabled="isSubmitting" required />
                </v-col>

                <v-col cols="12" md="6">
                    <v-text-field v-model="form.email" label="E-mail *" type="email" variant="outlined"
                        density="comfortable" :disabled="isSubmitting" required />
                </v-col>

                <v-col cols="12">
                    <v-text-field v-model="form.subject" label="Assunto *" variant="outlined" density="comfortable"
                        :disabled="isSubmitting" required />
                </v-col>

                <v-col cols="12">
                    <v-textarea v-model="form.message" label="Mensagem *" variant="outlined" rows="5"
                        :disabled="isSubmitting" required />
                </v-col>

                <v-col cols="12">
                    <v-btn type="submit" size="large" color="primary" :loading="isSubmitting" :disabled="isSubmitting"
                        class="text-none px-8" block>
                        Enviar Mensagem
                        <v-icon end>mdi-send</v-icon>
                    </v-btn>
                </v-col>
            </v-row>
        </form>
    </div>
</template>

<style scoped>
.contact-form {
    max-width: 700px;
    margin: 0 auto;
}

.contact-form-fields {
    background: white;
    padding: 40px;
    border-radius: 16px;
    border: 1px solid #f3f4f6;
}

@media (max-width: 600px) {
    .contact-form-fields {
        padding: 24px;
    }
}
</style>