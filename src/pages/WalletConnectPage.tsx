import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Wallet, TrendingUp, Shield, Zap, AlertCircle, RefreshCw } from 'lucide-react';

export function WalletConnectPage() {
  const navigate = useNavigate();
  const { connected, connecting: walletConnecting, wallet } = useWallet();
  const { user, loading, connecting, error, clearError } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (connected && user && !loading && !connecting) {
      console.log('[WalletConnectPage] User authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [connected, user, loading, connecting, navigate]);

  // Clear errors when wallet state changes
  useEffect(() => {
    if (walletConnecting) {
      setLocalError(null);
      clearError();
    }
  }, [walletConnecting, clearError]);

  // Check if Phantom is installed
  const [phantomDetected, setPhantomDetected] = useState(false);
  
  useEffect(() => {
    const checkPhantom = () => {
      const isPhantom = (window as any).phantom?.solana?.isPhantom;
      setPhantomDetected(!!isPhantom);
    };

    // Check immediately
    checkPhantom();

    // Also check when window loads (in case extension loads after component)
    if (document.readyState === 'loading') {
      window.addEventListener('load', checkPhantom);
      return () => window.removeEventListener('load', checkPhantom);
    }
  }, []);

  const isPhantomInstalled = phantomDetected;

  const displayError = error || localError;
  const isConnecting = connecting || walletConnecting;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-accent-primary/10 rounded-2xl">
                <img src="/logo.jpeg" alt="AI Prediction Market Advisor Logo" className="w-10 h-10 rounded-lg object-cover" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-text-primary">
                  AI Prediction Market Advisor
                </h1>
              </div>
            </div>
            
            <p className="text-xl text-text-secondary mb-12">
              Your intelligent companion for prediction market trading. Powered by AI, secured by blockchain.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-subtle rounded-lg flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    AI-Powered Recommendations
                  </h3>
                  <p className="text-text-secondary">
                    Get intelligent market insights and personalized trading strategies
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-subtle rounded-lg flex-shrink-0">
                  <Shield className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Risk Management
                  </h3>
                  <p className="text-text-secondary">
                    Advanced portfolio optimization using Kelly Criterion and behavioral analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent-subtle rounded-lg flex-shrink-0">
                  <Zap className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    Real-Time Analytics
                  </h3>
                  <p className="text-text-secondary">
                    Track your performance with comprehensive analytics and live market data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Wallet Connection */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-subtle rounded-full mb-6">
                  <Wallet className="w-10 h-10 text-accent-primary" />
                </div>
                <h2 className="text-h2 text-text-primary mb-2">Connect Your Wallet</h2>
                <p className="text-text-secondary">
                  Connect your Phantom wallet to get started with AI-powered prediction market trading
                </p>
              </div>

              <div className="space-y-6">
                {/* Error Display */}
                {displayError && (
                  <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-error">{displayError}</p>
                    </div>
                    <button
                      onClick={() => {
                        setLocalError(null);
                        clearError();
                      }}
                      className="p-1 hover:bg-error/20 rounded transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 text-error" />
                    </button>
                  </div>
                )}

                {/* Phantom Not Installed Warning */}
                {!isPhantomInstalled && (
                  <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning">Phantom wallet not detected</p>
                      <p className="text-xs text-warning/80 mt-1">
                        Please install Phantom wallet extension to continue
                      </p>
                    </div>
                  </div>
                )}

                {/* Wallet Connect Button */}
                <div className="flex justify-center">
                  <WalletMultiButton 
                    className="!bg-accent-primary hover:!bg-accent-primary/90 !text-bg-primary !font-semibold !rounded-lg !px-8 !py-3 !transition-all !duration-normal !text-base"
                  />
                </div>

                {/* Connection Status */}
                {isConnecting && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-accent-primary">
                      <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">
                        {walletConnecting ? 'Connecting wallet...' : 'Setting up your account...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Connected but loading */}
                {connected && !user && !isConnecting && loading && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-text-secondary">
                      <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading profile...</span>
                    </div>
                  </div>
                )}

                {/* Info Section */}
                <div className="pt-6 border-t border-border-subtle">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">
                    Why Phantom Wallet?
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary mt-0.5">•</span>
                      <span>Secure, non-custodial wallet for Solana</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary mt-0.5">•</span>
                      <span>Your keys, your crypto - full control</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary mt-0.5">•</span>
                      <span>No email or password required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent-primary mt-0.5">•</span>
                      <span>Seamless blockchain authentication</span>
                    </li>
                  </ul>
                </div>

                {/* Download Phantom */}
                <div className="pt-4">
                  <p className="text-xs text-text-tertiary text-center mb-2">
                    Don't have Phantom wallet?
                  </p>
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 px-4 bg-bg-hover hover:bg-bg-secondary text-accent-primary rounded-lg transition-colors text-sm font-medium"
                  >
                    Download Phantom Wallet
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
