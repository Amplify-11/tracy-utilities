<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed,Ref, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTranscriptStore } from '../stores/transcript';
import { SpeechRecognitionService } from '../utils/speech';
import Timer from './Timer.vue';
import WaveformVisualization from './WaveformVisualization.vue';
import WordsVisualization from './WordsVisualization.vue';
import TranscriptShare from './TranscriptShare.vue';
import { secondsToTimestamp } from '../utils/time'
import type { Word, Transcript, Segment, SpeechResult, InterimWord } from '../types';

const route = useRoute();
const router = useRouter();
const store = useTranscriptStore();

const isRecording = ref(false);
const existingTranscript = computed(() => store.transcripts.find(t => t.id === route.params.id));
const isNewTranscript = computed(() => !existingTranscript.value);
const isActiveRecording = computed(() => isRecording.value && !isPaused.value);
const transcriptForSharing = computed(() => {
  if (!showShare.value) {
    return {
      id: route.params.id as string,
      title: '',
      content: '',
      duration: 0,
      date: new Date().toISOString(),
      words: []
    } as Transcript;
  }
  return {
    id: route.params.id as string,
    title: content.value.slice(0, 50) + '...',
    content: content.value,
    duration: Date.now() - startTime.value,
    date: existingTranscript.value?.date || new Date().toISOString(),
    words: words.value
  } as Transcript;
});

const SEGMENT_GAP = 1000;
// Segments, are basically the words that are spoken in a row, like a sentence.
// This splits up words based on gaps in time.
const segments = computed(() => {
  const segments: Segment[] = [];
  let currentSegment: Segment | null = null;
  let lastProcessedIndex = -1;

  for (let i = 0; i < words.value.length; i++) {
    // Skip if we've already processed this word
    if (i <= lastProcessedIndex) continue;

    const word = words.value[i];
    const nextWord = words.value[i + 1];
    const prevWord = words.value[i - 1];

    // Check if this should be a single-word segment
    const gapToPrev = prevWord ? (word.time - prevWord.time) * 1000 : SEGMENT_GAP;
    const gapToNext = nextWord ? (nextWord.time - word.time) * 1000 : SEGMENT_GAP;
    
    if (gapToPrev >= SEGMENT_GAP && gapToNext >= SEGMENT_GAP) {
      // This is an isolated word - make it its own segment
      segments.push({
        text: word.word,
        startTime: word.time,
        endTime: word.time
      });
      lastProcessedIndex = i;
      continue;
    }

    // Start a new segment if we don't have one
    if (!currentSegment) {
      currentSegment = {
        text: word.word,
        startTime: word.time,
        endTime: word.time
      };
      lastProcessedIndex = i;
      continue;
    }

    // Check if we should end the current segment
    if (!nextWord || (nextWord.time - word.time) * 1000 >= SEGMENT_GAP) {
      // Add the current word to segment before closing it
      currentSegment.text += ' ' + word.word;
      currentSegment.endTime = word.time;
      segments.push(currentSegment);
      currentSegment = null;
      lastProcessedIndex = i;
    } else {
      // Add to current segment
      currentSegment.text += ' ' + word.word;
      currentSegment.endTime = word.time;
      lastProcessedIndex = i;
    }
  }

  // Add final segment if exists
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
});


const isPaused = ref(true); // Always start paused
const content = ref('');
const words = ref<Word[]>([]);
const currentWord = ref<Word>({ word: '', time: 0 });
const showShare = ref(false);
const startTime = ref(Date.now());
const error = ref('');

let speechService: Ref<SpeechRecognitionService | null> = ref(null);

// Only show recent words during active recording
const activeWords = computed(() => {
  if (!isRecording.value || isPaused.value) {
    return words.value;
  }
  // Only show words from the last 30 seconds when recording
  const cutoffTime = (Date.now() - startTime.value) / 1000 - 30;
  return words.value.filter(w => w.time >= cutoffTime);
});

// Add computed properties for timer
const initialDuration = computed(() => existingTranscript.value?.duration || 0);
const timerStartTime = computed(() => startTime.value);

// Separate state for interim and final words
const interimWords = ref<InterimWord[]>([]);
const finalWords = ref<Word[]>([]);

// Computed property for visualization that combines both interim and final words
const displayWords = computed(() => {
  return [
    ...finalWords.value,
    ...interimWords.value
  ].sort((a, b) => a.time - b.time);
});

function initializeFromExistingTranscript() {
  if (!existingTranscript.value) return;
  
  const transcript = existingTranscript.value;
  content.value = transcript.content;
  words.value = [...transcript.words];
  finalWords.value = [...transcript.words]; // Initialize finalWords with existing words
  currentWord.value = words.value[words.value.length - 1] || { word: '', time: 0 };
  
  // Set the start time based on the last word's time
  const lastWord = words.value[words.value.length - 1];
  if (lastWord) {
    startTime.value = Date.now() - (lastWord.time * 1000);
  } else {
    startTime.value = Date.now() - (transcript.duration || 0);
  }
  
  console.log('Initialized from existing transcript:', {
    content: content.value,
    words: words.value,
    finalWords: finalWords.value,
    currentWord: currentWord.value,
    startTime: startTime.value
  });
}

function handleInterimResult(result: SpeechResult) {
  const currentTime = (Date.now() - startTime.value) / 1000;
  
  // Clear previous interim results
  interimWords.value = [];
  
  // Add new interim words
  const words = result.text.split(' ')
    .filter(word => word.trim())
    .map(word => ({
      word: word.trim(),
      time: currentTime,
      isFinal: false
    }));

  interimWords.value = words;
  
  // Update current word for visualization
  if (words.length > 0) {
    currentWord.value = words[words.length - 1];
  }
}

function handleFinalResult(result: SpeechResult) {
  const currentTime = (Date.now() - startTime.value) / 1000;
  
  // Process final words
  const newWords = result.text.split(' ')
    .filter(word => word.trim())
    .map(word => ({
      word: word.trim(),
      time: currentTime
    }));

  // Add to final words array, but first check for duplicates
  // We'll consider words duplicates if they appear within 0.1 seconds of each other
  const uniqueNewWords = newWords.filter(newWord => {
    return !finalWords.value.some(existingWord => 
      Math.abs(existingWord.time - newWord.time) < 0.1 && 
      existingWord.word === newWord.word
    );
  });

  finalWords.value.push(...uniqueNewWords);
  words.value.push(...uniqueNewWords);
  
  // Update transcript content
  // Instead of just appending, let's rebuild from final words to avoid duplicates
  content.value = finalWords.value
    .sort((a, b) => a.time - b.time)
    .map(w => w.word)
    .join(' ');
  
  // Clear any interim results that might have been finalized
  interimWords.value = [];
}

function handleError(errorMessage: string) {
  console.error('Speech recognition error:', errorMessage);
  error.value = errorMessage;
  if (errorMessage.includes('not supported') || errorMessage.includes('denied')) {
    isRecording.value = false;
  }
}

function startRecording() {
  if (!speechService.value) {
    error.value = 'Speech recognition service is not initialized';
    return;
  }
  error.value = '';
  isRecording.value = true;
  isPaused.value = false;
  
  speechService.value.start(
    handleInterimResult,
    handleFinalResult,
    handleError
  );
}

function pauseRecording() {
  speechService.value?.pause();
  isPaused.value = true;
}

function resumeRecording() {
	showShare.value = false
  if (!speechService.value) {
    console.error('No speech service available');
    return;
  }
  
  error.value = '';
  isPaused.value = false;
  isRecording.value = true;
  
  // Important: Update the start time based on the last word
  const lastWord = words.value[words.value.length - 1];
  if (lastWord) {
    startTime.value = Date.now() - (lastWord.time * 1000);
  }
  
  console.log('Resuming with state:', {
    content: content.value,
    wordsCount: words.value.length,
    lastWord,
    startTime: startTime.value
  });

  // Don't reset content when resuming
  // if (!isNewTranscript.value && existingTranscript.value) {
  //   content.value = existingTranscript.value.content;
  // }
  
  // Make sure the speech service is properly reinitialized
  try {
    if (!speechService.value) {
      speechService.value = new SpeechRecognitionService();
    }
    speechService.value.start(
      handleInterimResult,
      handleFinalResult,
      handleError
    );
  } catch (e) {
    console.error('Failed to resume speech service:', e);
    error.value = 'Failed to resume recording.';
  }
}

function finishRecording() {
  isRecording.value = false;
  speechService.value?.stop();

  if (content.value.trim()) {
    // When finishing, make sure we have a clean, sorted array of unique words
    const uniqueWords = Array.from(new Set(finalWords.value.map(w => `${w.word}-${w.time}`)))
      .map(key => {
        const [word, time] = key.split('-');
        return {
          word,
          time: parseFloat(time)
        };
      })
      .sort((a, b) => a.time - b.time);

    const updatedTranscript: Transcript = {
      id: route.params.id as string,
      title: content.value.slice(0, 50) + '...',
      content: content.value,
      duration: Date.now() - startTime.value,
      date: existingTranscript.value?.date || new Date().toISOString(),
      words: uniqueWords
    };

    // Update instead of add if it's an existing transcript
    if (isNewTranscript.value) {
      store.addTranscript(updatedTranscript);
    } else {
      store.updateTranscript(updatedTranscript);
    }
    showShare.value = true;
  } else {
    error.value = 'No transcription recorded.';

  }
}

onMounted(() => {
  try {
    speechService.value = new SpeechRecognitionService();
    
    // Initialize state if we have an existing transcript
    if (!isNewTranscript.value) {
      initializeFromExistingTranscript();
    }
    
    // Only auto-start recording for new transcripts
    if (speechService.value && isNewTranscript.value) {
      startRecording();
    }
  } catch (e) {
    console.error('Failed to initialize speech recognition:', e);
    error.value = 'Failed to initialize speech recognition. Please make sure you are using a supported browser.';
  }
});

onUnmounted(() => {
  if (isRecording.value) {
    speechService.value?.stop();
  }
});


watch(() => segments.value, (newSegments, oldSegments) => {
	if(oldSegments.length > 0 && newSegments.length > oldSegments.length){
		// scroll to bottom
		nextTick(() => {
			if(segmentsContainer.value){
			segmentsContainer.value.scrollTop = segmentsContainer.value.scrollHeight
			}
		});
	}
})

const segmentsContainer = ref<HTMLDivElement | null>(null)
</script>

<template>
  <div class="transcript-detail">
    <!-- Top section -->

	<div v-if="error" class="error-message">
			{{ error }}
		</div>
      <header v-show="!showShare">
        <Timer 
          :is-running="isActiveRecording" 
          :initial-duration="initialDuration"
          :start-time="timerStartTime"
        />

		<WaveformVisualization
			:is-recording="isActiveRecording" 
			:words="activeWords"
		/>
		<WordsVisualization
			:current-word="currentWord"
			:words="displayWords"
		/>
	  </header>

    <div class="transcript-section" v-show="!showShare">
		<div class="transcript-content-shadow" />
      <div class="transcript-content" ref="segmentsContainer">
        <div v-for="segment in segments" :key="segment.startTime" class="segment">
          <div class="segment-time">{{secondsToTimestamp(segment.startTime)}}</div>
          <div class="segment-text">{{segment.text}}</div>
        </div>
      </div>
    </div>


	<div v-if="showShare">
		<TranscriptShare
        
        :transcript="transcriptForSharing"
      />
	</div>

    <!-- Bottom controls -->
    <div class="bottom-section">
      <div class="controls">
        <button
          v-if="!isPaused"
          @click="pauseRecording"
          class="control-button pause"
          :disabled="!!error || !speechService"
        >
          Pause
        </button>
        <button
          v-else
          @click="resumeRecording"
          class="control-button resume"
          :disabled="!!error || !speechService"
        >
          Resume
        </button>
        <button
			v-if="!isActiveRecording"
          @click="showShare || error ? router.push({name: 'home'}) : finishRecording()"
          class="control-button done"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transcript-detail {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}

.transcript-section {
  flex: 1 1 auto;
  margin: 0 var(--spacing-base);
  min-height: 100px;
  position: relative;
  overflow: hidden;
}

header{
	position: relative;
	padding: var(--spacing-base) var(--spacing-base) 0 var(--spacing-base);
	background: var(--surface-color);
	border-bottom: 1px solid var(--border-color);
	.timer{
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		top: 0.5em;
	}
	.words-visualization{
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		z-index: 100;
	}
}

.transcript-content {
  padding: var(--spacing-xl) var(--spacing-base);
  padding-left: 50px;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.transcript-content-shadow{
	position: absolute;
	top: 0;
	right: -40px;
	left: -40px;
	bottom: 0px;
	z-index: 100;
	box-shadow: inset 0 0 15px 15px var(--background-color);
	pointer-events: none;
}

.transcript-content::-webkit-scrollbar {
  display: none;
}

.segment {
  margin-bottom: var(--spacing-xs);
  display: flex;
  gap: var(--spacing-xs);
  align-items: baseline;
  position: relative;
}

.share-container{
	margin: var(--spacing-base);
}

.segment-time {
  color: var(--text-tertiary);
  font-size: var(--font-xs);
  white-space: nowrap;
  opacity: 0.7;
  position: absolute;
  right: 100%;
  padding-right: var(--spacing-xs);
  line-height: 1.5rem;
}

.segment-text {
  flex: 1;
  font-size: var(--font-xs);
  color: var(--text-primary);
  line-height: 1.5rem;
}

.bottom-section {
  flex: 0 0 auto;
  margin-top: auto;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);
}

.error-message {
  background-color: var(--danger-color);
  color: var(--text-primary);
  padding: var(--spacing-base);
  margin: var(--spacing-base) 0;
  border-radius: var(--radius-base);
  text-align: center;
  position: absolute;
  z-index: 100;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  left: var(--spacing-sm);

  font-size: var(--font-xs);
  box-sizing: border-box;
}

.controls {
  display: flex;
  gap: var(--spacing-base);
  justify-content: center;
  padding: var(--spacing-base) 0;
}

.control-button {
  padding: var(--spacing-base) var(--spacing-xl);
  border-radius: 3em;
  font-size: var(--font-lg);
  min-width: 100px;
  font-weight: 600;
  border:3px solid transparent;
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pause {
  background: var(--danger-color);
  color: var(--danger-color);
  background: transparent;
  border-color: var(--text-primary);
  box-sizing: border-box;
}

.resume {
  color: var(--text-primary);
  background: var(--danger-color);
  border-color: var(--text-primary);
  box-shadow: inset 0 0 0 3px var(--background-color);
}

.done {
  color: var(--primary-color);
  background: transparent;
}
</style>