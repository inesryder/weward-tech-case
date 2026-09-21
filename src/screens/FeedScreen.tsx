import { useQuery } from "@tanstack/react-query";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { API_BASE_URL } from "../data/config";

const fetchProvider = async (provider: string) => {
  const res = await fetch(`${API_BASE_URL}/${provider}`);
  if (!res.ok) throw new Error(`Failed to fetch ${provider}`);
  return res.json();
};

function ProviderSection({ provider }: { provider: string }) {
  const { data, error, isPending } = useQuery({
    queryKey: [provider],
    queryFn: () => fetchProvider(provider),
  });

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{provider}</Text>
      {isPending && <Text style={styles.body}>Loading…</Text>}
      {error && <Text style={styles.error}>{error.message}</Text>}
      {data && <Text style={styles.body}>{JSON.stringify(data, null, 2)}</Text>}
    </View>
  );
}

export function FeedScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProviderSection provider="provider-a" />
      <ProviderSection provider="provider-b" />
      <ProviderSection provider="provider-c" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    color: "#333",
  },
  error: {
    fontSize: 13,
    color: "#c00",
  },
});
