// Extended DeviceOrientationEvent interface for iOS Safari
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export class SensorService {
  private stepCount: number = 0;
  private lastAccelMag: number = 0;
  private lastZAccel: number = 0;

  // Request iOS 13+ motion & orientation permission if needed
  public async requestSensorsPermission(): Promise<boolean> {
    const DeviceOrientationClass = window.DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
    if (typeof DeviceOrientationClass !== 'undefined' && typeof DeviceOrientationClass.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationClass.requestPermission();
        return response === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true; // Non-iOS or permission already available
  }

  // Watch Device Orientation Compass Heading
  public watchOrientation(onHeadingUpdate: (heading: number) => void): () => void {
    const handleOrientation = (event: DeviceOrientationEventiOS) => {
      let compassHeading: number | null = null;

      if (typeof event.webkitCompassHeading === 'number') {
        compassHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Standard compass calculation from alpha/beta/gamma
        compassHeading = 360 - event.alpha;
      }

      if (compassHeading !== null) {
        onHeadingUpdate(Math.round(compassHeading % 360));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    };
  }

  // Watch Accelerometer for Indoor Step Counting
  public watchStepCounter(onStepDetected: (currentSteps: number) => void): () => void {
    this.stepCount = 0;
    this.lastAccelMag = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      const delta = Math.abs(magnitude - this.lastAccelMag);

      // Threshold for step detection (human stride impact)
      if (delta > 2.8 && this.lastAccelMag < 11.5 && magnitude > 11.5) {
        this.stepCount += 1;
        onStepDetected(this.stepCount);
      }

      this.lastAccelMag = magnitude;
    };

    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }

  // Reset Accelerometer Step Counter to 0 for new turn step segment
  public resetStepCounter(): void {
    this.stepCount = 0;
  }

  // Watch Altitude / Vertical Acceleration for Floor Change Detection (Climbing Stairs/Elevator)
  public watchAltitudeFloorChange(onFloorChange: (direction: 'up' | 'down') => void): () => void {
    let verticalAccumulator = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.z === null) return;

      const zDelta = acc.z - this.lastZAccel;
      if (Math.abs(zDelta) > 3.5) {
        verticalAccumulator += zDelta;
        if (verticalAccumulator > 14) {
          onFloorChange('up');
          verticalAccumulator = 0;
        } else if (verticalAccumulator < -14) {
          onFloorChange('down');
          verticalAccumulator = 0;
        }
      }
      this.lastZAccel = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }

  // Trigger Smartphone Haptic Vibration Feedback
  public triggerHapticFeedback(pattern: number[] = [80]): void {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // ignore
      }
    }
  }

  // Play Pleasant Arrival Audio Chime (Web Audio API)
  public playArrivalChime(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 tone
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 tone
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
  }

  public getStepCount(): number {
    return this.stepCount;
  }
}

export const sensorService = new SensorService();
