// context/AuthContext.tsx
"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import IUserInfo from '@/models/IUserInfo';
import ServiceProvider from '@/services/ServiceProvider';

interface AuthContextType {
  user: IUserInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const authService = ServiceProvider.getInstance().getAuthService();

  // Add this to track provider renders
  console.log('AuthProvider rendering - current state:', { loading, user: !!user });
  
  // Helper function to introduce a delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // In your AuthContext.tsx, add this logging
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server-side
    
    console.log('🔄 AuthProvider useEffect - setting up auth listener');
    
    const unsubscribe = authService.onAuthStateChanged(async (authUser) => {
      console.log(`🔥 === AUTH STATE CHANGE ===`);
      console.log('👤 AuthUser:', authUser);
      console.log('📍 Route:', window.location.pathname);
      console.log('🔧 isInitialized:', isInitialized);
      
      // Set initialized flag on first callback
      if (!isInitialized) {
        console.log('🚀 First auth state callback - marking as initialized');
        setIsInitialized(true);
      }
      
      if (authUser && authUser.email) {
        console.log('✅ Getting user info...');
        const userInfo = await authService.getUserInfoByEmail(authUser.email);
        console.log('✅ User info retrieved:', userInfo);
        setUser(userInfo);
      } else {
        console.log('❌ Setting user to null');
        setUser(null);
      }
      
      await delay(500);
      console.log('⏳ Setting loading to false');
      setLoading(false);
    });

    return () => {
      console.log('🧹 AuthProvider cleanup');
      if (unsubscribe) unsubscribe();
    };
  }, [authService, isInitialized]);
  
  
  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    if (result) {
      const userInfo = await authService.getUserInfoByEmail(email);
      setUser(userInfo);
    }
    return result;
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};