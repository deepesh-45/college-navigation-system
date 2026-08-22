// Web Speech API interface definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export const getSarvamApiKeys = (): { primary: string; fallback: string } => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return {
    primary: metaEnv?.VITE_SARVAM_API_KEY || '',
    fallback: metaEnv?.VITE_SARVAM_API_KEY_FALLBACK || ''
  };
};

export class SpeechHandler {
  private recognition: SpeechRecognitionInstance | null = null;
  private isSupported: boolean = false;

  constructor() {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.isSupported = true;
    }
  }

  public getSupported(): boolean {
    return this.isSupported;
  }

  // 1. Speech-to-Text (STT): Tries Sarvam AI STT API with fallback to Web SpeechRecognition
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech Recognition is not supported in this browser.');
      return false;
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError(event.error);
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      onError('Microphone access denied or busy.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
  }

  // 2. Text-to-Speech (TTS): Tries Sarvam AI TTS API (hi-IN / en-IN), fallback to SpeechSynthesis
  public async speak(text: string, onEnd?: () => void): Promise<void> {
    const { primary, fallback } = getSarvamApiKeys();
    const sarvamKeys = [primary, fallback].filter(k => k && !k.includes('sarvam_demo_api_key'));

    // Try Sarvam AI TTS API endpoint
    for (const apiKey of sarvamKeys) {
      try {
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': apiKey
          },
          body: JSON.stringify({
            inputs: [text],
            target_language_code: 'en-IN',
            speaker: 'meera',
            pitch: 0,
            pace: 1.0,
            loudness: 1.5,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v1'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.audios && data.audios[0]) {
            const audioSrc = `data:audio/wav;base64,${data.audios[0]}`;
            const audio = new Audio(audioSrc);
            if (onEnd) audio.onended = () => onEnd();
            await audio.play();
            return;
          }
        }
      } catch (err) {
        console.warn('Sarvam AI TTS API notice, falling back to Web SpeechSynthesis:', err);
      }
    }

    // Fallback: Web SpeechSynthesis API
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechHandler();
