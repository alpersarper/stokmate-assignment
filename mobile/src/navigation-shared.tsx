import { Pressable, StyleSheet, Text } from 'react-native';

/** Route params for the root native stack. */
export type RootStackParamList = {
  Login: undefined;
  ProductList: undefined;
  ProductDetail: { id: number };
};

/** Tiny text-button used by the placeholder screens only. */
export function LinkButton({
  label,
  onPress,
  emphasized,
}: {
  label: string;
  onPress: () => void;
  emphasized?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Text style={[styles.link, emphasized && styles.emphasized]}>{label}</Text>
    </Pressable>
  );
}

export const screenStyles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 22, fontWeight: '600', color: '#171717' },
  notice: { color: '#737373' },
});

const styles = StyleSheet.create({
  link: { color: '#171717', textDecorationLine: 'underline' },
  emphasized: { fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
