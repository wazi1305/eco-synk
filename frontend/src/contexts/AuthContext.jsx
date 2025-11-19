import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';
import userService from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const DEFAULT_EMAIL = 'ryanballoo@gmail.com';
    const DEFAULT_PASSWORD = 'StrongPass';

    const storage = typeof window !== 'undefined' ? window.sessionStorage : null;
    const persistentStorage = typeof window !== 'undefined' ? window.localStorage : null;

    const clearPersistentStorage = () => {
      persistentStorage?.removeItem('ecosynk_token');
      persistentStorage?.removeItem('ecosynk_user');
    };

    const saveSession = (sessionUser, sessionToken) => {
      storage?.setItem('ecosynk_token', sessionToken);
      storage?.setItem('ecosynk_user', JSON.stringify(sessionUser));
      clearPersistentStorage();
    };

    const bootstrapSession = async () => {
      clearPersistentStorage();
      setIsLoading(true);

      const storedToken = storage?.getItem('ecosynk_token') || null;

      if (storedToken) {
        const existingUserRaw = storage?.getItem('ecosynk_user');

        if (existingUserRaw) {
          try {
            const parsedUser = JSON.parse(existingUserRaw);
            if (isMounted) {
              setUser(parsedUser);
              setToken(storedToken);
            }
          } catch (error) {
            console.warn('Failed to parse stored user, clearing session', error);
            storage?.removeItem('ecosynk_user');
          }
        }

        const validation = await userService.getCurrentUser(storedToken);

        if (isMounted && validation.success) {
          saveSession(validation.user, storedToken);
          setUser(validation.user);
          setToken(storedToken);
          setIsLoading(false);
          return;
        }

        storage?.removeItem('ecosynk_token');
        storage?.removeItem('ecosynk_user');
      }

      const loginResult = await authService.login(DEFAULT_EMAIL, DEFAULT_PASSWORD);

      if (!isMounted) {
        return;
      }

      if (loginResult.success) {
        saveSession(loginResult.user, loginResult.token);
        setUser(loginResult.user);
        setToken(loginResult.token);
      } else {
        console.error('Automatic login failed', loginResult.error);
        setUser(null);
        setToken(null);
      }

      setIsLoading(false);
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async () => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsLoading(true);
    const result = await authService.login('ryanballoo@gmail.com', 'StrongPass');

    if (result.success) {
      window.sessionStorage.setItem('ecosynk_token', result.token);
      window.sessionStorage.setItem('ecosynk_user', JSON.stringify(result.user));
      window.localStorage.removeItem('ecosynk_token');
      window.localStorage.removeItem('ecosynk_user');
      setUser(result.user);
      setToken(result.token);
    } else {
      console.error('Manual session refresh failed', result.error);
    }

    setIsLoading(false);
  };

  const logout = () => {
    console.warn('Logout is disabled while the demo user is enforced.');
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};