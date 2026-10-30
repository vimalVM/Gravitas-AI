import { createContext } from 'react';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
/** Signed-in user's workspace: their conversation, live messages and presence. */
export const WorkspaceContext = createContext(null);
