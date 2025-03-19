export interface Transcript {
  id: string;
  title: string;
  content: string;
  duration: number;
  date: string;
  words: Word[];
}

export interface Word {
  word: string;
  time: number;
  isFinal?: boolean;
}

export interface Segment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface WaveformData {
  amplitude: number;
  timestamp: number;
}

export interface ShareOptions {
  type: 'email' | 'sheet';
  destination: string;
}

export interface SpeechResult {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export interface InterimWord extends Word {
  isFinal: boolean;
}
