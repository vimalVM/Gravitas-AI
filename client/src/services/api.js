import { API_BASE_URL } from '../config/app';
import { supabase } from '../lib/supabaseClient';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details, isNetwork = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isNetwork = isNetwork;
  }

  /** Worth retrying automatically (connection problems, server hiccups, rate limits). */
  get retryable() {
    return this.isNetwork || this.status >= 500 || this.status === 429;
  }
}

const NETWORK_MESSAGE = "Can't reach the Gravitas AI server. Check your connection and make sure the backend is running.";

const STATUS_MESSAGES = {
  400: 'The request was invalid.',
  401: 'Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'That item could not be found.',
  413: 'The file is too large.',
  415: 'That file type is not supported.',
  429: 'Too many requests. Please wait a moment.',
};

let unauthorizedHandler = null;
/** Registered by the auth provider: called when a session can no longer be refreshed. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function toApiError(status, payload) {
  return new ApiError(payload?.error?.message || STATUS_MESSAGES[status] || 'Something went wrong. Please try again.', {
    status,
    code: payload?.error?.code,
    details: payload?.error?.details,
  });
}

async function refreshOr401() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    unauthorizedHandler?.();
    return false;
  }
  return true;
}

/** JSON request to the Express API with the current Supabase access token. */
export async function apiRequest(path, { method = 'GET', body, signal, retryOnExpired = true } = {}) {
  const token = await getAccessToken();
  if (!token) throw new ApiError('Please sign in to continue.', { status: 401, code: 'AUTH_REQUIRED' });

  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(NETWORK_MESSAGE, { isNetwork: true, code: 'NETWORK_ERROR' });
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && retryOnExpired && payload?.error?.code === 'INVALID_SESSION') {
      if (await refreshOr401()) return apiRequest(path, { method, body, signal, retryOnExpired: false });
    }
    throw toApiError(response.status, payload);
  }
  return payload?.data;
}

/** multipart/form-data upload with progress reporting (0-100). */
export async function apiUpload(path, formData, { onProgress, retryOnExpired = true } = {}) {
  const token = await getAccessToken();
  if (!token) throw new ApiError('Please sign in to continue.', { status: 401, code: 'AUTH_REQUIRED' });

  const result = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.responseType = 'json';
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(NETWORK_MESSAGE, { isNetwork: true, code: 'NETWORK_ERROR' }));
    xhr.ontimeout = xhr.onerror;
    xhr.onload = () => resolve({ status: xhr.status, payload: xhr.response });
    xhr.send(formData);
  });

  if (result.status >= 200 && result.status < 300) return result.payload?.data;
  if (result.status === 401 && retryOnExpired && result.payload?.error?.code === 'INVALID_SESSION') {
    if (await refreshOr401()) return apiUpload(path, formData, { onProgress, retryOnExpired: false });
  }
  throw toApiError(result.status, result.payload);
}
