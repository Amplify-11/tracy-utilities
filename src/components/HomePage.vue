<script setup lang="ts">
import { useRouter } from 'vue-router';
import TranscriptList from './TranscriptList.vue';

const router = useRouter();

function startNewTranscript() {
  const id = Date.now().toString();
  router.push({name: 'transcript', params: {id}});
}
</script>

<template>
  <div class="home-container">
    <TranscriptList />

    <button @click="startNewTranscript" class="new-transcript-button" />
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100dvh;
  position: relative;
  background: var(--background-color);
}

.new-transcript-button {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 20vw;
  height: 20vw;
  border-radius: 50%;
  background: var(--danger-color);
  border:3px solid white;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 9999;
  box-shadow: inset 0 0 0 4px var(--background-color);
}

.new-transcript-button:hover {
  box-shadow: 0 6px 16px rgba(255, 59, 48, 0.5);
}

.button-icon {
  font-size: 24px;
}
</style>