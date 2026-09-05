<template>
  <Transition
    appear
    enter-active-class="transition ease-out duration-100"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-75"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <Dialog
      :open="open"
      class="relative z-50"
      @close="handleClose"
    >
      <div
        class="fixed inset-0 bg-gray-500/50"
        aria-hidden="true"
      />
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        >
          <DialogTitle class="text-lg font-semibold text-gray-900">
            Upload Syllabus
          </DialogTitle>
          <p class="mt-1 text-sm text-gray-500">
            Share a PDF or DOCX syllabus for
            {{ courseCode }}. It will be checked against the course and
            summarized automatically.
          </p>

          <form
            class="mt-4 space-y-4"
            @submit.prevent="submit"
          >
            <div>
              <label
                for="syllabus-instructor"
                class="block text-sm font-medium text-gray-900"
              >
                Instructor
              </label>
              <select
                id="syllabus-instructor"
                v-model="instructorId"
                required
                class="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              >
                <option
                  :value="null"
                  disabled
                >
                  Select instructor…
                </option>
                <option
                  v-for="instructor in instructors"
                  :key="instructor.id"
                  :value="instructor.id"
                >
                  {{ instructor.name }}
                </option>
              </select>
            </div>

            <div>
              <label
                for="syllabus-file"
                class="block text-sm font-medium text-gray-900"
              >
                Syllabus file
              </label>
              <input
                id="syllabus-file"
                type="file"
                accept=".pdf,.docx"
                class="mt-1 block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                @change="onFileChange"
              />
              <p class="mt-1 text-sm text-gray-500">
                PDF or DOCX, up to 20 MB.
              </p>
            </div>

            <div
              v-if="uploadError"
              class="rounded-md bg-red-50 p-3"
            >
              <div class="text-sm text-red-700">{{ uploadError }}</div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                :disabled="busy"
                @click="handleClose"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                :disabled="busy || !file || !instructorId"
              >
                {{ busy ? "Uploading…" : "Upload" }}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  </Transition>
</template>

<script setup>
import { ref, watch } from "vue";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { useSyllabi } from "../composables/useSyllabi";

const props = defineProps({
  open: { type: Boolean, default: false },
  courseId: { type: [String, Number], required: true },
  courseCode: { type: String, default: "" },
  instructors: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "uploaded"]);

const file = ref(null);
const instructorId = ref(null);
const busy = ref(false);
const uploadError = ref("");

watch(
  () => props.open,
  (open) => {
    if (open) {
      file.value = null;
      instructorId.value = null;
      uploadError.value = "";
    }
  },
);

const onFileChange = (event) => {
  uploadError.value = "";
  file.value = event.target.files?.[0] ?? null;
};

const handleClose = () => {
  if (busy.value) return;
  emit("close");
};

const submit = async () => {
  if (!file.value || !instructorId.value) return;
  if (file.value.size > 20 * 1024 * 1024) {
    uploadError.value = "File exceeds the 20 MB upload limit.";
    return;
  }
  busy.value = true;
  uploadError.value = "";
  try {
    const { uploadSyllabus } = useSyllabi();
    const created = await uploadSyllabus(props.courseId, {
      file: file.value,
      instructorId: instructorId.value,
    });
    emit("uploaded", created);
    emit("close");
  } catch (e) {
    const raw = e.raw;
    if (raw && raw.file) {
      uploadError.value = Array.isArray(raw.file) ? raw.file[0] : raw.file;
    } else if (raw && raw.instructor) {
      uploadError.value = Array.isArray(raw.instructor)
        ? raw.instructor[0]
        : raw.instructor;
    } else {
      uploadError.value = e.message;
    }
  } finally {
    busy.value = false;
  }
};
</script>
