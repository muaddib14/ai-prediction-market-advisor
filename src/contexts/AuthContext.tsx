import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface User {
  id: string;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  connecting: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, connecting: walletConnecting, disconnect } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function handleWalletConnection() {
      // If wallet is connected and has public key
      if (connected && publicKey) {
        if (!isMounted) return;
        
        setConnecting(true);
        setError(null);
        
        try {
          const walletAddress = publicKey.toBase58();
          console.log('[AuthContext] Wallet connected:', walletAddress);
          
          // Check if profile exists for this wallet
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', walletAddress)
            .maybeSingle();

          if (!isMounted) return;

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('[AuthContext] Error fetching profile:', fetchError);
            setError('Failed to fetch profile. Please try again.');
            setConnecting(false);
            setLoading(false);
            return;
          }

          if (existingProfile) {
            // Profile exists, use it
            console.log('[AuthContext] Found existing profile');
            setUser({
              id: existingProfile.user_id,
              walletAddress,
            });
            setProfile(existingProfile);
          } else {
            // Create new profile for this wallet
            console.log('[AuthContext] Creating new profile');
            const newUserId = crypto.randomUUID();
            const defaultProfile = {
              user_id: newUserId,
              wallet_address: walletAddress,
              risk_tolerance: 'moderate',
              kelly_fraction: 0.5,
              max_drawdown_pct: 10.0,
              max_position_size: 0.1,
              api_key_connected: false,
              notifications_enabled: true,
              dark_mode: true,
            };

            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert(defaultProfile)
              .select()
              .maybeSingle();

            if (!isMounted) return;

            if (insertError) {
              console.error('[AuthContext] Error creating profile:', insertError);
              setError('Failed to create profile. Please try again.');
              setConnecting(false);
              setLoading(false);
              return;
            }

            if (newProfile) {
              // Also create initial portfolio
              try {
                await supabase.from('portfolios').insert({
                  user_id: newUserId,
                  name: 'Main Portfolio',
                  total_value: 0,
                  cash_balance: 1000, // Starting demo balance
                  pnl_total: 0,
                  pnl_percent: 0,
                });
              } catch (portfolioError) {
                console.error('[AuthContext] Error creating portfolio:', portfolioError);
                // Non-critical error, continue
              }

              setUser({
                id: newUserId,
                walletAddress,
              });
              setProfile(newProfile);
              console.log('[AuthContext] Profile created successfully');
            }
          }
        } catch (err) {
          console.error('[AuthContext] Error handling wallet connection:', err);
          if (isMounted) {
            setError('Connection error. Please try again.');
          }
        } finally {
          if (isMounted) {
            setConnecting(false);
            setLoading(false);
          }
        }
      } else if (!connected) {
        // Wallet disconnected or not connected
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setConnecting(false);
        }
      }
    }

    handleWalletConnection();

    return () => {
      isMounted = false;
    };
  }, [connected, publicKey]);

  async function signOut() {
    try {
      await disconnect();
    } catch (err) {
      console.error('[AuthContext] Error disconnecting:', err);
    }
    setUser(null);
    setProfile(null);
    setError(null);
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('No user logged in') };

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (!updateError) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error: updateError ? new Error(updateError.message) : null };
    } catch (err) {
      console.error('[AuthContext] Error updating profile:', err);
      return { error: err instanceof Error ? err : new Error('Unknown error') };
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      connecting: connecting || walletConnecting,
      error,
      signOut, 
      updateProfile,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
