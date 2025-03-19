<script setup lang="ts">
import { computed } from 'vue';
import type { Transcript } from '../types';

const props = defineProps<{
  transcript: Transcript;
}>();

const formattedDate = computed(() => {
  return new Date(props.transcript.date).toLocaleDateString();
});

const formattedDuration = computed(() => {
  const minutes = Math.floor(props.transcript.duration / 60000);
  const seconds = Math.floor((props.transcript.duration % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
});
</script>

<template>
  <router-link :to="{name: 'transcript', params: {id: transcript.id}}" class="transcript-item">
    <div class="transcript-info">
      <h3>{{ transcript.title }}</h3>
    	<div class="transcript-meta">
			<span>{{ formattedDate }}</span>
      		<span>{{ formattedDuration }}</span>
			<span>{{ transcript.words.length }} words</span>
    	</div>
    </div>
  </router-link>
</template>

<style scoped>
.transcript-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s;
}

.transcript-item:hover {
  background-color: var(--surface-color);
}

.transcript-info {
  flex: 1;
}

.transcript-info h3 {
  margin: 0;
  font-size: 1.1rem;
}

.transcript-preview {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.transcript-meta {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

</style>