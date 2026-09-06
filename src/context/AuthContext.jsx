import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions or local demo user
    const getSession = async () => {
      try {
        const savedDemoUser = localStorage.getItem('grabit_demo_user');
        if (savedDemoUser) {
          setUser(JSON.parse(savedDemoUser));
          setLoading(false);
          return;
        }
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUser(data.session.user);
        }
      } catch (err) {
        console.warn('[AuthContext] Supabase session check skipped/failed:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    let subscription = null;
    try {
      const authRes = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      });
      subscription = authRes?.data?.subscription;
    } catch (e) {
      setLoading(false);
    }

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const loginAsDemo = (email = 'candidate@grabit.ai', username = 'Demo Candidate') => {
    const mockUser = {
      id: 'demo-user-12345',
      email: email || 'candidate@grabit.ai',
      user_metadata: { username: username || 'Demo Candidate' },
      isDemo: true
    };
    localStorage.setItem('grabit_demo_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signOut = async () => {
    localStorage.removeItem('grabit_demo_user');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  const value = {
    signUp: async (data) => {
      try {
        const res = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              username: data.username,
            }
          }
        });
        return res;
      } catch (err) {
        throw new Error(err.message || 'Failed to connect to Supabase authentication service.');
      }
    },
    signIn: async (data) => {
      try {
        const res = await supabase.auth.signInWithPassword(data);
        return res;
      } catch (err) {
        throw new Error(err.message || 'Failed to connect to Supabase authentication service.');
      }
    },
    loginAsDemo,
    signOut,
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

