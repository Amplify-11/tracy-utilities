<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { msToTimestamp } from '../utils/time'

const props = defineProps<{
  isRunning: boolean;
  initialDuration?: number;
  startTime: number;
}>();

const elapsed = ref(props.initialDuration || 0);

function updateTime() {
  if (props.isRunning) {
    elapsed.value = Date.now() - props.startTime;
  }
}



const formattedTime = computed(() => msToTimestamp(elapsed.value));



let interval: number | null = null;

watch(() => props.isRunning, (isRunning) => {
  if (isRunning) {
    interval = window.setInterval(updateTime, 100);
  } else if (interval) {
    window.clearInterval(interval);
  }
});

onMounted(() => {
  if (props.isRunning) {
    interval = window.setInterval(updateTime, 100);
  }
});

onUnmounted(() => {
  if (interval) {
    window.clearInterval(interval);
  }
});
</script>

<template>
  <div class="timer">
    {{ formattedTime }}
  </div>
</template>

<style scoped>
.timer {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: monospace;
}
</style>