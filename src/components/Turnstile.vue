<template>
  <div ref="turnstileContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
  sitekey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["verify", "expire", "error"]);

const turnstileContainer = ref(null);
let widgetId = null;

const renderTurnstile = () => {
  if (window.turnstile && turnstileContainer.value) {
    widgetId = window.turnstile.render(turnstileContainer.value, {
      sitekey: props.sitekey,
      callback: (token) => emit("verify", token),
      "expired-callback": () => emit("expire"),
      "error-callback": () => emit("error"),
    });
  }
};

onMounted(() => {
  if (window.turnstile) {
    renderTurnstile();
  } else {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    window.onloadTurnstileCallback = () => {
      renderTurnstile();
    };
  }
});

onUnmounted(() => {
  if (widgetId) {
    window.turnstile.remove(widgetId);
  }
});

const reset = () => {
  if (widgetId) {
    window.turnstile.reset(widgetId);
  }
};

defineExpose({ reset });
</script>
