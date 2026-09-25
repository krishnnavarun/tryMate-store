import { useContext } from 'react';
import { AuthContext } from '../context/contexts.js';

// { user, status: 'loading' | 'ready', login, register, logout, setUser }
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
