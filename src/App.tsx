import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { FeedScreen } from './screens/FeedScreen';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <FeedScreen />
    </QueryClientProvider>
  );
}
