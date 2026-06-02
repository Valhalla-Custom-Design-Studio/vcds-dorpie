import { Redirect } from 'expo-router';

/**
 * Tab route /geo → redirects to the GeoFence screen.
 */
export default function GeoTab() {
  return <Redirect href="/geofence" />;
}
