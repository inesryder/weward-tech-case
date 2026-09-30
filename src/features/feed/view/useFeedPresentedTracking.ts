import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { logger } from "../../../app/logger";
import { createId, SESSION_ID } from "../../../app/session";
import { ProviderId } from "../domain/FeedItem";
import {
  countPresented,
  FeedPresentedEvent,
  FeedPresentedTrigger,
  presentedSections,
} from "./feedPresentedEvent";
import { FeedRow } from "./feedRows";

const APP_INFO = {
  version: Constants.expoConfig?.version ?? "unknown",
  platform: Platform.OS,
  osVersion: String(Platform.Version),
};

type Params = {
  rows: readonly FeedRow[];
  isSettled: boolean;
  failedProviders: ProviderId[];
};

/**
 * Fires `feed_presented` once the content settles after the screen mounts, after a
 * pull-to-refresh, and after a load more or retry that presented new entries.
 */
export function useFeedPresentedTracking({ rows, isSettled, failedProviders }: Params) {
  const [screenView] = useState(() => ({ id: createId(), mountedAt: Date.now() }));
  const tracking = useRef<{
    sequence: number;
    reported: Set<string>;
    pending: FeedPresentedTrigger | null;
  }>({ sequence: 0, reported: new Set(), pending: "initial" });

  useEffect(() => {
    const state = tracking.current;
    const trigger = state.pending;
    if (!isSettled || trigger === null) return;

    state.pending = null;
    if (trigger === "refresh") state.reported.clear();
    const { sections, keys } = presentedSections(rows, state.reported);
    if (trigger !== "initial" && trigger !== "refresh" && keys.length === 0) return;

    keys.forEach((key) => state.reported.add(key));
    state.sequence += 1;

    const event: FeedPresentedEvent = {
      name: "feed_presented",
      trigger,
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      screenViewId: screenView.id,
      sequence: state.sequence,
      app: APP_INFO,
      msSinceScreenMount: Date.now() - screenView.mountedAt,
      failedProviders,
      sections,
      counts: countPresented(sections),
    };
    logger.info("feed_presented", event);
  }, [isSettled, rows, failedProviders, screenView]);

  const mark = (trigger: FeedPresentedTrigger) => {
    tracking.current.pending = trigger;
  };

  return {
    logLoadMore: () => mark("load_more"),
    logRefresh: () => mark("refresh"),
    logRetry: () => mark("retry"),
  };
}
