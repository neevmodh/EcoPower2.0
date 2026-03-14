'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { loginUser } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem('instinctUser');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('instinctUser', JSON.stringify(data));
    setUser(data);
    
    // Redirect based on role
    if (data.role === 'Admin') router.push('/admin');
    else if (data.role === 'Enterprise') router.push('/enterprise');
    else router.push('/consumer');
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('instinctUser');
    setUser(null);
    router.push('/login');
  };

  const getInitials = () => {
    if (!user) return '';
    return user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getInitials }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
