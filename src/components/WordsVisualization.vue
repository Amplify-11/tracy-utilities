<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import type { Word } from '../types';

const props = defineProps<{
  currentWord: Word;
  words: Word[];
}>();

// Create computed properties for reactive props
const currentWordComputed = computed(() => props.currentWord);
const wordsComputed = computed(() => props.words);

// Change the words ref to store objects with word and timestamp
const displayWords = ref<{ text: string; timestamp: number; isFinal: boolean }[]>([]);

const DISPLAY_DURATION = 2000; // 5 seconds
let cleanupInterval: number | null = null;

// Cleanup function to remove old words
const cleanupOldWords = () => {
  displayWords.value = displayWords.value.filter(
    word => Date.now() - word.timestamp < DISPLAY_DURATION
  );
};

// Update watch to use computed property
watch(() => currentWordComputed.value, (newWord) => {
  if (newWord) {
    // Check if the word already exists in the recent history
    const isDuplicate = displayWords.value.some(w => w.text === newWord.word);
    
    if (!isDuplicate) {
      displayWords.value.push({
        text: newWord.word,
        timestamp: Date.now(),
        isFinal: newWord.isFinal || false
      });
      
      if (displayWords.value.length > 5) {
        displayWords.value.shift();
      }
    }
  }
});

// Set up the interval when component is mounted
onMounted(() => {
  cleanupInterval = window.setInterval(cleanupOldWords, 100); // Check every 100ms
});

// Clean up the interval when component is unmounted
onUnmounted(() => {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
  }
});
</script>

<template>
  <div class="words-visualization">
    <!-- Show recent words with fade effect -->
    <div class="recent-words">
      <transition-group name="word-transition">
        <span
          v-for="word in displayWords"
          :key="word.timestamp"
          :class="{
            'word': true,
            'current': word.text === currentWordComputed.word,
            'interim': !word.isFinal
          }"
        >
          {{ word.text }}
        </span>
      </transition-group>
    </div>
  </div>
</template>

<style scoped>
.words-visualization {
  padding: var(--spacing-base);
  text-align: center;
}

.recent-words {
  display: flex;
  gap: var(--spacing-xs);
  justify-content: center;
  align-items: center;
  min-height: 40px;
  font-weight: 550;
  text-transform: capitalize;
}

.word {
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  overflow: hidden;
  white-space: nowrap;
}

.current {
  transform: scale(1.1);
  color: var(--primary-color);
}

/* Custom transition for smooth width animation */
.word-transition-enter-active,
.word-transition-leave-active {
  transition: all 0.5s ease-in-out;
}

.word-transition-enter-from {
  max-width: 0;
  opacity: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: 0;
  margin-right: 0;
}

.word-transition-leave-to {
  max-width: 0;
  opacity: 0;
  padding-left: 0;
  padding-right: 0;
  margin-left: 0;
  margin-right: 0;
}

.word-transition-enter-to,
.word-transition-leave-from {
  max-width: 200px; /* Set a max-width large enough for your words */
}
</style>