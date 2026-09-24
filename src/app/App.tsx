import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { LikeAnimationProvider } from '../features/like/view/LikeAnimationProvider';
import { ToastHost } from './toast/ToastHost';
import { likeCountsQuery } from '../features/like/domain/likeQueries';
import { queryClient } from './queryClient';
import { FeedScreen } from '../features/feed/view/FeedScreen';

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
