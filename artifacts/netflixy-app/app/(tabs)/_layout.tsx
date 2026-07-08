import { Redirect } from 'expo-router';

// All routing is handled by app/index.tsx — redirect here just in case
export default function TabLayout() {
  return <Redirect href="/" />;
}
