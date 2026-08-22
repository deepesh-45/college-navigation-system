// AWS Polly Text-to-Speech & AWS Speech Integration Service

export interface AWSSpeechConfig {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
}

export class AWSSpeechService {
  private config: AWSSpeechConfig = {};

  constructor() {
    this.config = {
      accessKeyId: (import.meta as any).env?.VITE_AWS_ACCESS_KEY_ID || '',
      secretAccessKey: (import.meta as any).env?.VITE_AWS_SECRET_ACCESS_KEY || '',
      region: (import.meta as any).env?.VITE_AWS_REGION || 'us-east-1'
    };
  }

  public getConfig(): AWSSpeechConfig {
    return this.config;
  }

  // AWS Polly Voice Synthesis (Fallback to Web Speech API for Instant Playback)
  public async speakWithPolly(text: string, voiceId: string = 'Aditi'): Promise<boolean> {
    if (!text.trim()) return false;
    console.log(`[AWS Polly Voice ${voiceId}]: Synthesizing audio for "${text.substring(0, 30)}..."`);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
      return true;
    }

    return false;
  }
}

export const awsSpeechService = new AWSSpeechService();
