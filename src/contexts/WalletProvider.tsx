import React, { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  // Use devnet for development, mainnet for production
  const network = process.env.NODE_ENV === 'production' 
    ? WalletAdapterNetwork.Mainnet 
    : WalletAdapterNetwork.Devnet;

  // RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Only include Phantom wallet for this application
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  // Error handler for wallet errors
  const onError = useCallback((error: WalletError) => {
    console.error('[WalletProvider] Wallet error:', error.name, error.message);
    
    // Handle specific error types
    if (error.name === 'WalletNotReadyError') {
      console.log('[WalletProvider] Phantom wallet not installed or not ready');
    } else if (error.name === 'WalletConnectionError') {
      console.log('[WalletProvider] Failed to connect to wallet');
    } else if (error.name === 'WalletDisconnectedError') {
      console.log('[WalletProvider] Wallet disconnected');
    } else if (error.name === 'WalletAccountError') {
      console.log('[WalletProvider] Error with wallet account');
    } else if (error.name === 'WalletPublicKeyError') {
      console.log('[WalletProvider] Error getting public key from wallet');
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={onError}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
