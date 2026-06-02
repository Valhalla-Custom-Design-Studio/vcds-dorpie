import { Redirect } from 'expo-router';

/**
 * /settings/phantom → redirects to the Phantom Alert™ covert calculator screen.
 * This route exists so the Settings menu item resolves correctly.
 */
export default function PhantomSettings() {
  return <Redirect href="/phantom-alert" />;
}
