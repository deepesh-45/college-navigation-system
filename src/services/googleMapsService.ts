import { Loader } from '@googlemaps/js-api-loader';

let loaderInstance: Loader | null = null;

export const getGoogleMapsApiKey = (): string => {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return metaEnv?.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const loadGoogleMapsApi = async (): Promise<typeof google.maps | null> => {
  const apiKey = getGoogleMapsApiKey();
  
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: apiKey || 'AIzaSyDemoApiKeyForCollegeCampusNavSystem',
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  try {
    const loaderObj = loaderInstance as unknown as { load: () => Promise<unknown> };
    if (typeof loaderObj.load === 'function') {
      await loaderObj.load();
    }
    return window.google ? window.google.maps : null;
  } catch (error) {
    console.warn('Google Maps API Loader notice:', error);
    return window.google ? window.google.maps : null;
  }
};
