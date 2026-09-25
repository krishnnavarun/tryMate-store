import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { AuthContext } from './contexts.js';

// Holds the logged-in user for the whole app.
// status: 'loading' until we've asked the server "who am I?" once, then 'ready'.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  // On first load, the cookie (if any) tells the server who we are
  useEffect(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch(() => setUser(null)) // 401 = not logged in, which is fine
      .finally(() => setStatus('ready'));
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedIn = await authApi.login(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    const created = await authApi.register(details);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null); // log out locally even if the request failed
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
