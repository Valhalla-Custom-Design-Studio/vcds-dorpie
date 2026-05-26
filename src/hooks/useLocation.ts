import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function useLocation(watch = false) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, accuracy: loc.coords.accuracy ?? undefined });
      setLoading(false);

      if (watch) {
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
          (l) => setLocation({ latitude: l.coords.latitude, longitude: l.coords.longitude })
        );
      }
    })().catch((e) => { setError(e.message); setLoading(false); });

    return () => { sub?.remove(); };
  }, [watch]);

  return { location, error, loading };
}
