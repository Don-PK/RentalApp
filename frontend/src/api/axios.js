import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  timeout: 15000,
});

// Simple in-memory cache for GET requests to make navigation feel snappier.
// Cached entries live for `DEFAULT_TTL_MS` milliseconds.
const DEFAULT_TTL_MS = 10_000; // 10s
const cache = new Map(); // key -> { expiry, data }
const inflight = new Map(); // key -> promise (dedupe concurrent requests)

function cacheKey(config) {
  return `${config.method || 'get'}::${config.url}::${JSON.stringify(config.params || {})}`;
}

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Only cache GET requests
  if ((config.method || 'get').toLowerCase() === 'get') {
    const key = cacheKey(config);
    const now = Date.now();
    const entry = cache.get(key);
    if (entry && entry.expiry > now) {
      // short-circuit by attaching cached response to config to be read by response interceptor
      config.__cachedResponse = entry.data;
      return config;
    }

    // If there's an inflight identical request, attach its promise so callers can await it
    if (inflight.has(key)) {
      config.__inflightKey = key;
    }
  }

  return config;
});

api.interceptors.response.use((response) => {
  const config = response.config || {};
  // If caller had cached response attached, return it instead of network result
  if (config.__cachedResponse) {
    return Promise.resolve({ ...response, data: config.__cachedResponse, fromCache: true });
  }

  // Store GET responses in cache
  if ((config.method || 'get').toLowerCase() === 'get') {
    const key = cacheKey(config);
    cache.set(key, { expiry: Date.now() + DEFAULT_TTL_MS, data: response.data });
    // clear inflight
    if (inflight.has(key)) inflight.delete(key);
  }

  return response;
}, (err) => {
  // if request failed, ensure inflight cleaned up
  const config = err.config || {};
  if ((config.method || 'get').toLowerCase() === 'get') {
    const key = cacheKey(config);
    if (inflight.has(key)) inflight.delete(key);
  }
  return Promise.reject(err);
});

// Wrapper to dedupe concurrent GETs and return cached data when possible.
const getWithCache = async (url, config = {}) => {
  const finalConfig = { method: 'get', url, ...config };
  const key = cacheKey(finalConfig);

  // Return cached immediately if valid
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) return { data: entry.data, fromCache: true };

  if (inflight.has(key)) return inflight.get(key);

  const p = api(finalConfig).then(res => ({ data: res.data, fromCache: !!res.fromCache })).finally(() => {
    if (inflight.has(key)) inflight.delete(key);
  });
  inflight.set(key, p);
  return p;
};

// attach helper to api instance
api.getCached = getWithCache;

export default api;