import { Redirect } from 'expo-router';

/**
 * Tab route /ai-misdaad → redirects to the AI Crime Analysis screen.
 */
export default function AiMisdaadTab() {
  return <Redirect href="/ai-crime" />;
}
