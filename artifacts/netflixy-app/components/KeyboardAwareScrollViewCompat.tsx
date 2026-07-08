// react-native-keyboard-controller removed (not Expo Go compatible).
// Simple ScrollView wrapper that works everywhere.
import { ScrollView, ScrollViewProps } from 'react-native';

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: ScrollViewProps & { keyboardShouldPersistTaps?: 'handled' | 'always' | 'never' }) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
