<template>
  <div>
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium leading-6 text-gray-900"
    >
      {{ label }}
    </label>
    <div :class="[label ? 'mt-2' : '', 'relative']">
      <input
        :id="id"
        :value="modelValue"
        :type="showPassword ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :required="required"
        :placeholder="placeholder"
        class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
        :class="[
          hasError
            ? 'ring-red-500 focus:ring-red-500'
            : 'ring-gray-300 focus:ring-indigo-600',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        type="button"
        class="absolute inset-y-0 right-0 flex items-center pr-3"
        @click="showPassword = !showPassword"
      >
        <EyeIcon
          v-if="showPassword"
          class="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
        <EyeSlashIcon
          v-else
          class="h-5 w-5 text-gray-400"
          aria-hidden="true"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

defineProps({
  modelValue: String,
  label: String,
  id: String,
  autocomplete: {
    type: String,
    default: "current-password",
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: String,
  hasError: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue"]);

const showPassword = ref(false);
</script>
