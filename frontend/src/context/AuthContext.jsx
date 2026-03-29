import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  useEffect(() => { if (token) loadUser(); else setLoading(false); }, [token]);
  const loadUser = async () => { try { const r = await authAPI.getMe(); setUser(r.data); } catch { logout(); } finally { setLoading(false); } };
  const login = async (c) => { const r = await authAPI.login(c); localStorage.setItem('token', r.data.access_token); setToken(r.data.access_token); setUser(r.data.user); };
  const register = async (d) => { const r = await authAPI.register(d); localStorage.setItem('token', r.data.access_token); setToken(r.data.access_token); setUser(r.data.user); };
  const logout = () => { localStorage.clear(); setToken(null); setUser(null); };
  return <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
