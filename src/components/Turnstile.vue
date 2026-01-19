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
let script = null;

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

const handleScriptLoad = () => {
  renderTurnstile();
};

onMounted(() => {
  if (window.turnstile) {
    renderTurnstile();
    return;
  }

  const SCRIPT_ID = "cloudflare-turnstile-script";
  script = document.getElementById(SCRIPT_ID);

  if (!script) {
    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
  script.addEventListener("load", handleScriptLoad);
});

onUnmounted(() => {
  if (widgetId && window.turnstile) {
    window.turnstile.remove(widgetId);
  }
});

const reset = () => {
  if (widgetId) {
    window.turnstile.reset(widgetId);
  }

  if (script) {
    script.removeEventListener("load", handleScriptLoad);
  }
};

defineExpose({ reset });
</script>
