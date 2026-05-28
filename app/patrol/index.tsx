import { Redirect } from 'expo-router';

/**
 * Patrol entry — redirects to active patrol dashboard.
 * Patrol mode: live GPS tracking, incident reporting, zone coverage map.
 */
export default function PatrolRedirect() {
  return <Redirect href="/patrol/dashboard" />;
}
