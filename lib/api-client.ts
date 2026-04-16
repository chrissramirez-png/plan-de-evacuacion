// Make authenticated API calls — reads access token directly from localStorage
export async function authFetch(url: string, options: RequestInit = {}) {
  let token: string | null = null;

  // Find the Supabase auth token in localStorage
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "");
        if (data?.access_token) {
          token = data.access_token;
          break;
        }
      } catch {}
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
