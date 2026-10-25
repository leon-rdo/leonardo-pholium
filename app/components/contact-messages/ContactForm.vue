<script setup lang="ts">
/**
 * Contact form. Sits inside the dark CTA tile in pages/index.vue.
 * Native Tailwind inputs, no Vuetify. Submission still POSTs to the
 * Django backend at /api/contact-messages/.
 */
import { Send, AlertCircle, CheckCircle2 } from 'lucide-vue-next';

const config = useRuntimeConfig();
const { locale, t } = useI18n();
const { trackEvent } = useAnalytics();

const form = ref({ name: '', email: '', subject: '', message: '' });
const isSubmitting = ref(false);
const submitted = ref(false);
const error = ref('');

const resetForm = () => {
  form.value = { name: '', email: '', subject: '', message: '' };
  error.value = '';
};

const submitForm = async () => {
  if (!form.value.name || !form.value.email || !form.value.subject || !form.value.message) {
    error.value = t('contact.validationAllFields');
    return;
  }
  if (!form.value.email.includes('@')) {
    error.value = t('contact.validationEmail');
    return;
  }

  isSubmitting.value = true;
  error.value = '';
  try {
    await $fetch('/api/contact-messages/', {
      baseURL: config.public.apiBase,
      method: 'POST',
      headers: {
        'Accept-Language': locale.value === 'pt-br' ? 'pt-br' : 'en-us',
      },
      body: form.value,
    });
    // The confirmation stays until the visitor starts another message — it
    // used to vanish after 5s, before a slow reader (or a screen reader)
    // had taken it in.
    submitted.value = true;
    trackEvent('contact_form_submit');
    resetForm();
  } catch (err: any) {
    console.error('Contact form error:', err);
    error.value = err?.data?.message || t('contact.errorMessage');
  } finally {
    isSubmitting.value = false;
  }
};

// Inputs sit inside the always-dark "night" CTA tile, so we pick fg/bg
// values that don't flip when the rest of the page changes color mode.
// `bg-night-input` is a token defined once (no .dark override).
const inputClass =
  'w-full bg-night-input text-night-text placeholder:text-night-text/40 ' +
  'border border-white/10 rounded-input ' +
  'px-4 py-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ' +
  'focus:ring-offset-night transition-shadow ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';
</script>

<template>
  <div>
    <!-- Success / Error banners (rendered inside the always-dark CTA).
         The live region is always mounted: a role="status" node inserted
         with v-if is often not announced at all. It only takes space once
         it has something to say. -->
    <div aria-live="polite" class="[&:not(:empty)]:mb-4">
      <div
        v-if="submitted"
        class="flex items-start gap-3 px-4 py-3 rounded-card border border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
      >
        <CheckCircle2 :size="18" :stroke-width="1.8" class="mt-0.5 shrink-0" />
        <div class="text-[14px] leading-[1.5]">
          <strong class="font-semibold">{{ t('contact.successTitle') }}</strong>
          <div class="opacity-90">{{ t('contact.successMessage') }}</div>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 flex items-start gap-3 px-4 py-3 rounded-card border border-rose-500/30 bg-rose-500/15 text-rose-100"
      role="alert"
    >
      <AlertCircle :size="18" :stroke-width="1.8" class="mt-0.5 shrink-0" />
      <div class="text-[14px] leading-[1.5] flex-1">{{ error }}</div>
      <button
        type="button"
        class="text-[12px] opacity-70 hover:opacity-100"
        :aria-label="t('common.close', 'Close')"
        @click="error = ''"
      >
        ✕
      </button>
    </div>

    <!-- Form -->
    <form
      class="grid grid-cols-1 md:grid-cols-2 gap-3"
      @submit.prevent="submitForm"
      @input="submitted = false"
    >
      <label class="block">
        <span class="font-mono-rail !text-night-text/70 text-[11px] mb-1.5 block">{{ t('contact.name') }}</span>
        <input
          v-model="form.name"
          type="text"
          required
          autocomplete="name"
          :disabled="isSubmitting"
          :class="inputClass"
        />
      </label>

      <label class="block">
        <span class="font-mono-rail !text-night-text/70 text-[11px] mb-1.5 block">{{ t('contact.email') }}</span>
        <input
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          :disabled="isSubmitting"
          :class="inputClass"
        />
      </label>

      <label class="block md:col-span-2">
        <span class="font-mono-rail !text-night-text/70 text-[11px] mb-1.5 block">{{ t('contact.subject') }}</span>
        <input
          v-model="form.subject"
          type="text"
          required
          :disabled="isSubmitting"
          :class="inputClass"
        />
      </label>

      <label class="block md:col-span-2">
        <span class="font-mono-rail !text-night-text/70 text-[11px] mb-1.5 block">{{ t('contact.message') }}</span>
        <textarea
          v-model="form.message"
          rows="5"
          required
          :disabled="isSubmitting"
          :class="inputClass + ' resize-y min-h-[120px]'"
        />
      </label>

      <div class="md:col-span-2">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-fg font-semibold py-3.5 rounded-input hover:bg-accent-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {{ isSubmitting ? t('common.loading') : t('contact.send') }}
          <Send :size="16" :stroke-width="2" />
        </button>
      </div>
    </form>
  </div>
</template>
