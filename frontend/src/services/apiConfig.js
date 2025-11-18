const DEV_SERVER_PORTS = new Set(['5173', '4173', '4174']);

const sanitizeUrl = (url) => {
  if (!url) {
    return null;
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const resolveApiBaseUrl = () => {
  const envUrl = sanitizeUrl(import.meta.env?.VITE_API_URL);
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    const configuredPort = import.meta.env?.VITE_API_PORT;
    const fallbackPort = configuredPort || '8000';
    const resolvedPort = DEV_SERVER_PORTS.has(port) ? fallbackPort : port;
    const portSegment = resolvedPort ? `:${resolvedPort}` : '';
    return `http://${hostname}${portSegment}`;
  }

  return 'http://localhost:8000';
};

export const API_BASE_URL = resolveApiBaseUrl();
