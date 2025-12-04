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
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* FIX APPLIED: autoConnect={true} 
        This ensures that selecting a wallet in the modal immediately 
        prompts the user to connect, removing the need for a second click.
      */}
      <SolanaWalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={onError}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};