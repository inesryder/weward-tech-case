import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "./queryClient";
import { ToastHost } from "./toast/ToastHost";
import { FeedScreen } from "../features/feed/view/FeedScreen";
import { serverLikesQuery } from "../features/like/domain/likeQueries";
import { LikeAnimationProvider } from "../features/like/view/LikeAnimationProvider";

export default function App() {
  useEffect(() => {
    // Reconcile cached like counts with the server as early as possible, in parallel with the feed.
    queryClient.query(serverLikesQuery).catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LikeAnimationProvider>
          <StatusBar style="auto" />
          <FeedScreen />
          <ToastHost />
        </LikeAnimationProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
