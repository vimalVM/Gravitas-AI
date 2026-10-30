import gravitas from '@shared/gravitas.config.json';

/** Branding, group and demo project - edit shared/gravitas.config.json to change them. */
export const APP = gravitas.app;
export const GROUP = gravitas.group;
export const DEFAULT_PROJECT = gravitas.project;

export const PROJECT_STATUS = {
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  on_hold: { label: 'On Hold', className: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
};

export const UPLOADS = {
  maxBytes: gravitas.uploads.maxImageMb * 1024 * 1024,
  maxMb: gravitas.uploads.maxImageMb,
  acceptedTypes: gravitas.uploads.allowedImageTypes,
};

export const MAX_MESSAGE_LENGTH = 4000;

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '');

export const ROLE_HOME = { user: '/chat', ai_operator: '/ai/dashboard' };
export const ROLE_LOGIN = { user: '/login/user', ai_operator: '/login/ai' };
