import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    // Don't set Content-Type for FormData (browser will set it with boundary)
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    // Don't JSON.stringify FormData
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build the URL from the queryKey parts
    let url = queryKey[0] as string;
    if (queryKey.length > 1) {
      // Add the rest of the query key parts to the URL
      for (let i = 1; i < queryKey.length; i++) {
        if (queryKey[i] !== undefined && queryKey[i] !== null) {
          url = url.replace(/\/?$/, '/') + queryKey[i];
        }
      }
    }
    console.log("Fetching URL:", url);
    
    // Check for cached data first (browser cache for GET requests)
    // We use different Cache-Control headers based on the resource type
    const headers: HeadersInit = {};
    const cacheConfig = getCacheConfig(queryKey);
    
    if (cacheConfig.staleTime > 0) {
      // Convert staleTime from ms to seconds for HTTP cache max-age
      const maxAge = Math.floor(cacheConfig.staleTime / 1000);
      headers['Cache-Control'] = `max-age=${maxAge}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Define the caching strategy based on query key patterns
const cacheConfigs = {
  // Resource data that changes infrequently
  static: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days (renamed from cacheTime in React Query v5)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  },
  
  // User's own data that changes occasionally
  user: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (renamed from cacheTime in React Query v5)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  
  // Team data that changes occasionally
  team: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime in React Query v5)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  
  // Real-time data for collaboration
  realtime: {
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 60 * 1000, // 1 minute (renamed from cacheTime in React Query v5)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
};

// Function to determine query cache configurations based on query key
const getCacheConfig = (queryKey: readonly unknown[]) => {
  const path = queryKey[0] as string;
  
  // Apply different caching strategies based on resource type
  if (path.includes('/api/teams') && queryKey.length > 2 && queryKey[2] === 'members') {
    return cacheConfigs.team; // Team members
  }
  
  if (path.includes('/api/teams') || path.includes('/api/churches')) {
    return cacheConfigs.team; // Team or church data
  }
  
  if (path.includes('/api/user')) {
    return cacheConfigs.user; // Current user data
  }
  
  if (path.includes('/api/users')) {
    return cacheConfigs.user; // User data
  }
  
  // Default to static for other resources
  return cacheConfigs.static;
};

// Apply custom cache configurations based on the query key
const defaultQueryFn = getQueryFn({ on401: "throw" });

// Set up query client with dynamic cache configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: 0 as const, // Use 0 instead of false
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000, // 1 minute default for unspecified queries
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in React Query v5)
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

// Create a custom hook to apply specific cache settings when creating queries
export function useCustomQueryOptions<TData>(queryKey: readonly unknown[]) {
  const customCacheConfig = getCacheConfig(queryKey);
  
  return {
    queryKey,
    ...customCacheConfig,
  };
}
