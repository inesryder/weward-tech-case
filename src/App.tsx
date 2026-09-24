import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { LikeAnimationProvider } from './components/likes/LikeAnimationProvider';
import { ToastHost } from './components/toast/ToastHost';
import { likeCountsQuery } from './queries/likesQueries';
import { queryClient } from './queries/queryClient';
import { FeedScreen } from './screens/FeedScreen';

export default function App() {
  useEffect(() => {
    // Reconcile cached like counts with the server as early as possible, in parallel with the feed.
    queryClient.prefetchQuery(likeCountsQuery);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LikeAnimationProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <FeedScreen />
          <ToastHost />
        </View>
      </LikeAnimationProvider>
    </QueryClientProvider>
  );
}
