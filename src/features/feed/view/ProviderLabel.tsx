import { StyleSheet, Text } from "react-native";
import { ProviderId } from "../domain/FeedItem";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  "provider-a": "Provider A",
  "provider-b": "Provider B",
  "provider-c": "Provider C",
};

export function ProviderLabel({ provider }: { provider: ProviderId }) {
  return <Text style={styles.label}>{PROVIDER_LABELS[provider]}</Text>;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 2,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#FF732B",
  },
});
