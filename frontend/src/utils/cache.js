const memoryCache = new Map();

const now = () => Date.now();

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getMemoryCache = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expires && entry.expires < now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
};

export const setMemoryCache = (key, value, ttlMs = 60000) => {
  memoryCache.set(key, {
    value,
    expires: ttlMs ? now() + ttlMs : null,
  });
};

export const deleteMemoryCache = (key) => {
  memoryCache.delete(key);
};

export const clearMemoryCache = () => {
  memoryCache.clear();
};

export const getStorageCache = (key, maxAgeMs = 300000) => {
  if (!canUseStorage()) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed.expires && parsed.expires < now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    if (maxAgeMs && parsed.storedAt && parsed.storedAt + maxAgeMs < now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch (error) {
    console.warn('Cache read failed', error);
    return null;
  }
};

export const setStorageCache = (key, value, ttlMs = 0) => {
  if (!canUseStorage()) {
    return;
  }
  try {
    const payload = {
      value,
      storedAt: now(),
      expires: ttlMs ? now() + ttlMs : null,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('Cache write failed', error);
  }
};

export const clearStorageCache = (key) => {
  if (!canUseStorage()) {
    return;
  }
  try {
    if (key) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.clear();
    }
  } catch (error) {
    console.warn('Cache clear failed', error);
  }
};

export const createCacheKey = (prefix, params = {}) => {
  const serialized = Object.keys(params)
    .sort()
    .map((paramKey) => `${paramKey}:${JSON.stringify(params[paramKey])}`)
    .join('|');
  return `${prefix}::${serialized}`;
};
