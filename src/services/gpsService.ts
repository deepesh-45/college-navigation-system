export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

// Haversine formula to compute distance in meters between two GPS coordinates
export function calculateGpsDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Compute compass bearing angle (0 - 360 degrees) from start to destination GPS
export function calculateGpsBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const rad = Math.PI / 180;
  const dLng = (lng2 - lng1) * rad;
  const phi1 = lat1 * rad;
  const phi2 = lat2 * rad;

  const y = Math.sin(dLng) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  let brng = Math.atan2(y, x) * (180 / Math.PI);
  return Math.round((brng + 360) % 360);
}

export class GpsService {
  private watchId: number | null = null;

  public isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  public watchPosition(
    onLocationUpdate: (pos: GpsPosition) => void,
    onError: (errMessage: string) => void
  ): boolean {
    if (!this.isSupported()) {
      onError('Geolocation API is not supported on this device/browser.');
      return false;
    }

    this.stopWatcher();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      (err) => {
        onError(err.message || 'GPS location access denied or unavailable.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    return true;
  }

  public stopWatcher(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

export const gpsService = new GpsService();
