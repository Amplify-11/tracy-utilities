// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
  resultIndex: number;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onInterimResultCallback: (result: SpeechResult) => void = () => {};
  private onFinalResultCallback: (result: SpeechResult) => void = () => {};
  private onErrorCallback: (error: string) => void = () => {};

  constructor(language: string = 'en-US') {
    console.log('Initializing SpeechRecognitionService...');
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      console.log('Speech Recognition API is supported');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition(language);
    } else {
      console.error('Speech Recognition API is not supported in this browser');
      this.onErrorCallback('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }
  }

  private setupRecognition(language: string) {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = language;

    this.recognition.onstart = () => {
      console.log('Speech recognition service has started');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('Received speech recognition result:', event);
      try {
        // Process each result
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          const speechResult: SpeechResult = {
            text: transcript,
            isFinal: result.isFinal,
            timestamp: Date.now()
          };

          if (result.isFinal) {
            this.onFinalResultCallback(speechResult);
          } else {
            this.onInterimResultCallback(speechResult);
          }
        }
      } catch (error) {
        console.error('Error processing speech result:', error);
        this.onErrorCallback('Error processing speech input');
      }
    };

    this.recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      const errorMessage = this.getErrorMessage(event.error);
      this.onErrorCallback(errorMessage);
      if (event.error !== 'no-speech') {
        this.restart();
      }
    };

    this.recognition.onend = () => {
      console.log('Speech recognition service disconnected');
      if (this.isListening) {
        console.log('Attempting to restart speech recognition...');
        this.recognition?.start();
      }
    };
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'not-allowed':
        return 'Microphone access was denied. Please allow microphone access and try again.';
      case 'no-speech':
        return 'No speech was detected. Please try speaking again.';
      case 'audio-capture':
        return 'No microphone was found. Please ensure your microphone is connected.';
      case 'network':
        return 'Network error occurred. Please check your internet connection.';
      case 'aborted':
        return 'Speech recognition was aborted. Please try again.';
      default:
        return `Speech recognition error: ${error}`;
    }
  }

  public start(
    onInterimResult: (result: SpeechResult) => void,
    onFinalResult: (result: SpeechResult) => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }

    console.log('Starting speech recognition...');
    this.onInterimResultCallback = onInterimResult;
    this.onFinalResultCallback = onFinalResult;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      onError('Failed to start speech recognition. Please try again.');
    }
  }

  public stop() {
    console.log('Stopping speech recognition...');
    this.isListening = false;
    this.recognition?.stop();
  }

  public restart() {
    if (this.isListening) {
      console.log('Restarting speech recognition...');
      this.recognition?.stop();
      setTimeout(() => this.recognition?.start(), 100);
    }
  }

  public pause() {
    console.log('Pausing speech recognition...');
    this.isListening = false;
    this.recognition?.stop();
  }

  public resume() {
    console.log('Resuming speech recognition...');
    if (!this.isListening) {
      this.isListening = true;
      this.recognition?.start();
    }
  }
}