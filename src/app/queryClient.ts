import { QueryClient } from "@tanstack/react-query";

/** App-wide client, shared by React (via the provider) and non-React code such as the likes sync. */
export const queryClient = new QueryClient();
