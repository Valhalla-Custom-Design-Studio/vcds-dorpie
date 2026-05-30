import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const token = useAuthStore((s) => s.token);
  return token ? <Redirect href="/(tabs)/index" /> : <Redirect href="/(auth)/welcome" />;
}
