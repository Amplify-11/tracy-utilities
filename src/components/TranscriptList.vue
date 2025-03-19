<script setup lang="ts">
import { useTranscriptStore } from '../stores/transcript';
import TranscriptListItem from './TranscriptListItem.vue';

const store = useTranscriptStore();
</script>

<template>
  <div class="transcript-list">
    <div class="search-container">
      <input
        v-model="store.searchQuery"
        type="text"
        placeholder="Search transcripts..."
        class="search-input"
      />
    </div>

    <div class="list-container">
      <TranscriptListItem
        v-for="transcript in store.filteredTranscripts"
        :key="transcript.id"
        :transcript="transcript"
      />
    </div>
  </div>
</template>

<style scoped>
.transcript-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-container {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 1rem;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}
</style>