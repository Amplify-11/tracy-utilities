import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Transcript } from '../types';

export const useTranscriptStore = defineStore('transcript', {
  state: () => ({
    transcripts: [] as Transcript[],
    searchQuery: ''
  }),
  
  getters: {
    filteredTranscripts: (state) => {
      if (!state.searchQuery) return state.transcripts;
      
      const query = state.searchQuery.toLowerCase();
      return state.transcripts.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
      );
    }
  },

  actions: {
    addTranscript(transcript: Transcript) {
      this.transcripts.unshift(transcript);
    },
    updateTranscript(transcript: Transcript) {
      const index = this.transcripts.findIndex(t => t.id === transcript.id);
      if (index !== -1) {
        this.transcripts[index] = transcript;
      }
    },
    deleteTranscript(id: string) {
      this.transcripts = this.transcripts.filter(t => t.id !== id);
    },
    setSearchQuery(query: string) {
      this.searchQuery = query;
    }
  },
  
  persist: true
});