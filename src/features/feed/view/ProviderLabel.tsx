import { StyleSheet, Text, TextStyle } from "react-native";
import { ProviderId } from "../domain/FeedItem";

const PROVIDER_LABELS: Record<ProviderId, string> = {
  "provider-a": "Provider A",
  "provider-b": "Provider B",
  "provider-c": "Provider C",
};

type Props = {
  provider: ProviderId;
  color?: TextStyle["color"];
};

export function ProviderLabel({ provider, color = "#3a6ea5" }: Props) {
  return <Text style={[styles.label, { color }]}>{PROVIDER_LABELS[provider]}</Text>;
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 2,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
