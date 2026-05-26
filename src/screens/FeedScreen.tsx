import { StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../data/config';

/**
 * This is the screen you'll be building.
 *
 * Three sections, three provider endpoints, one like feature, one tracking event.
 * See the README for the full brief.
 *
 * Replace this placeholder with your implementation. Add folders, files,
 * libraries, and tests as you see fit.
 */
export function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feed Case</Text>
      <Text style={styles.body}>Backend: {API_BASE_URL}</Text>
      <Text style={styles.body}>See README.md for the brief.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});
