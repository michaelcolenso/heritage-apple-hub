import { createTRPCReact } from "@trpc/react-query";
import { TRPCClientError, httpBatchLink } from "@trpc/client";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import superjson from "superjson";
import { toast } from "sonner";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { LOGIN_PATH } from "@/const";

export const trpc = createTRPCReact<AppRouter>();

let hasHandledAuthFailure = false;

function isUnauthorizedMutationError(error: unknown) {
  return (
    error instanceof TRPCClientError &&
    error.data?.code === "UNAUTHORIZED"
  );
}

function handleAuthMutationFailure(queryClient: QueryClient) {
  if (hasHandledAuthFailure) {
    return;
  }

  hasHandledAuthFailure = true;
  toast.error("Your session has expired. Please sign in again.");
  queryClient.clear();

  if (window.location.pathname !== LOGIN_PATH) {
    window.location.assign(LOGIN_PATH);
    return;
  }

  window.setTimeout(() => {
    hasHandledAuthFailure = false;
  }, 1500);
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isUnauthorizedMutationError(error)) {
        handleAuthMutationFailure(queryClient);
      }
    },
  }),
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
