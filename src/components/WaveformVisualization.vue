<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue';
import type { Word } from '../types';

const props = defineProps<{
  isRecording: boolean;
  words: Word[];
}>();

// Create computed properties for reactive props
const isRecordingComputed = computed(() => props.isRecording);

const canvas = ref<HTMLCanvasElement | null>(null);
const audioContext = ref<AudioContext | null>(null);
const analyser = ref<AnalyserNode | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const animationFrame = ref<number | null>(null);

async function setupAudioContext() {
  try {
    audioContext.value = new AudioContext();
    analyser.value = audioContext.value.createAnalyser();
    analyser.value.fftSize = 256;

    mediaStream.value = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.value.createMediaStreamSource(mediaStream.value);
    source.connect(analyser.value);

    drawWaveform();
  } catch (error) {
	alert('Error setting up audio context:' + (error as Error).message)
    console.error('Error setting up audio context:', error);
  }
}

const BAR_WIDTH = 10;
const BAR_GAP = 3;
const BAR_COLOR = '#ff453a';
const SAMPLE_RATE = 60; // How often we sample the audio (in Hz)
const DISPLAY_RATE = 30; // How many new bars per second
const AMPLIFY_WAVEFORM = 3;
const dataPoints = ref<number[]>([]);
const currentAmplitude = ref<number>(0); // Track current amplitude for smooth updates
const lastSampleTime = ref<number>(0);
const lastMoveTime = ref<number>(0);

function drawWaveform() {
  if (!canvas.value || !analyser.value) return;

  const ctx = canvas.value.getContext('2d');
  if (!ctx) return;

  const bufferLength = analyser.value.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    if (!ctx || !isRecordingComputed.value) return;

    // Sample the audio at SAMPLE_RATE - update currentAmplitude continuously
    const now = Date.now();
    if (now - lastSampleTime.value >= (1000 / SAMPLE_RATE)) {
      analyser.value!.getByteTimeDomainData(dataArray);
      currentAmplitude.value = Math.abs(dataArray.reduce((acc, val) => 
        acc + (val - 128) / 128.0, 0) / bufferLength) * AMPLIFY_WAVEFORM;
      
      // Only add new bar at DISPLAY_RATE
      if (now - lastMoveTime.value >= (1000 / DISPLAY_RATE)) {
        dataPoints.value.unshift(currentAmplitude.value);
        lastMoveTime.value = now;
        
        // Keep only the needed number of points
        const maxBars = Math.floor(canvas.value!.width / (BAR_WIDTH + BAR_GAP));
        if (dataPoints.value.length > maxBars) {
          dataPoints.value = dataPoints.value.slice(0, maxBars);
        }
      }
      
      lastSampleTime.value = now;
    }

    // Clear canvas with themed background
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--surface-color');
    ctx.fillRect(0, 0, canvas.value!.width, canvas.value!.height);

    // Draw bars
    ctx.lineCap = 'round';
    ctx.strokeStyle = BAR_COLOR;
    ctx.lineWidth = BAR_WIDTH;

    const centerY = canvas.value!.height / 2;
    let x = canvas.value!.width - BAR_WIDTH / 2;

    // First bar uses current amplitude for smooth updates
    if (dataPoints.value.length > 0) {
      const barHeight = currentAmplitude.value * canvas.value!.height * 0.8;
      const y1 = centerY - barHeight / 2;
      const y2 = centerY + barHeight / 2;

      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      x -= (BAR_WIDTH + BAR_GAP);
    }

    // Rest of the bars
    dataPoints.value.slice(1).forEach((amplitude) => {
      const barHeight = amplitude * canvas.value!.height * 0.8;
      const y1 = centerY - barHeight / 2;
      const y2 = centerY + barHeight / 2;

      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      x -= (BAR_WIDTH + BAR_GAP);
    });

    animationFrame.value = requestAnimationFrame(draw);
  }

  draw();
}


watch(() => isRecordingComputed.value, (newValue) => {
  if (newValue) {
    if (!audioContext.value) {
      setupAudioContext();
    }
    drawWaveform();
  } else {
    if (animationFrame.value) {
      cancelAnimationFrame(animationFrame.value);
    }
  }
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop());
  }
  if (audioContext.value) {
    audioContext.value.close();
  }
  document.addEventListener('touchend', ()=> audioContext.value?.resume());
});
</script>

<template>
  <canvas ref="canvas" class="waveform" width="800" height="200"></canvas>
</template>

<style scoped>
.waveform {
  width: 100%;
  height: 20vh;
  float: left;
}
</style>
