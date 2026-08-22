// Extended DeviceOrientationEvent interface for iOS Safari
interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export class SensorService {
  private stepCount: number = 0;
  private lastAccelMag: number = 0;

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

  // Watch Accelerometer for Indoor Step Counting (Dead Reckoning approximation)
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

  public getStepCount(): number {
    return this.stepCount;
  }
}

export const sensorService = new SensorService();
