import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  LayoutDashboard, 
  Wallet, 
  BarChart3, 
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function LandingPage() {
  const navigate = useNavigate();
  const { connected, connect, wallet, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const { user } = useAuth();

  // Smart Handler: Handles all connection states
  const handleMainAction = useCallback(async () => {
    if (connected) {
      navigate('/dashboard');
    } else if (wallet && !connected) {
      // FIX: If wallet is selected but not connected, force connection
      try {
        await connect();
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      // Otherwise open the modal to select a wallet
      setVisible(true); 
    }
  }, [connected, wallet, navigate, setVisible, connect]);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6 text-accent-primary" />,
      title: "AI Market Predictions",
      description: "Proprietary algorithms analyze sentiment and volume to predict market outcomes with high accuracy."
    },
    {
      icon: <Shield className="w-6 h-6 text-accent-primary" />,
      title: "Kelly Criterion Risk",
      description: "Automated position sizing ensures you never over-leverage, protecting your portfolio from ruin."
    },
    {
      icon: <Zap className="w-6 h-6 text-accent-primary" />,
      title: "Real-Time Execution",
      description: "Instant trade signals and execution through the Solana blockchain for minimal latency."
    }
  ];

  const stats = [
    { label: "Active Traders", value: "2,000+" },
    { label: "Predictions Made", value: "15K+" },
    { label: "Volume Analyzed", value: "$50M+" },
  ];

  const steps = [
    {
      icon: <Wallet className="w-5 h-5" />,
      title: "Connect Wallet",
      desc: "Link your Phantom wallet securely. Non-custodial."
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Get Insights",
      desc: "AI scans markets for +EV opportunities."
    },
    {
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: "Manage Portfolio",
      desc: "Track performance and adjust risk in real-time."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* Navbar */}
      <nav className="border-b border-border-subtle bg-bg-secondary/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-10 h-10 bg-accent-primary/10 rounded-xl flex items-center justify-center">
              <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <span className="font-bold text-xl text-text-primary hidden sm:block">
              Kalshorb AI Advisor
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
              <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-text-primary transition-colors">How it Works</a>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            v2.0 Now Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-8 tracking-tight leading-tight">
            Prediction Markets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Solved by Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Stop gambling. Start trading. We use institutional-grade AI to model 
            prediction market outcomes and optimize your sizing.
          </p>

          <div className="flex flex-col items-center gap-6">
            {/* FIX APPLIED:
              1. Uses 'icon' prop so text and icon stay on the same line.
              2. Logic handles 'Selected but not Connected' state.
              3. Shows 'loading' state while connecting.
            */}
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg gap-3 shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 transition-all whitespace-nowrap z-20"
              onClick={handleMainAction}
              loading={connecting}
              icon={
                connected ? (
                  <LayoutDashboard className="w-5 h-5" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )
              }
            >
              {connected 
                ? "Enter Dashboard" 
                : (wallet && !connected ? "Connect Wallet" : "Connect Wallet to Start")
              }
            </Button>

            {connected ? (
              <p className="text-sm text-green-400 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-4 h-4" />
                Wallet connected successfully. Ready to trade.
              </p>
            ) : (
              <p className="text-sm text-text-tertiary">
                Supports Phantom, Solflare, and Backpack
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
            {stats.map((stat, i) => (
              <div key={i} className="text-center pt-8 md:pt-0">
                <div className="text-4xl font-bold text-text-primary mb-2">{stat.value}</div>
                <div className="text-text-tertiary uppercase text-sm font-semibold tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Why AI Advisor?</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              We combine traditional financial modeling with blockchain transparency.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 group hover:border-accent-primary/40 transition-all duration-300 hover:bg-bg-secondary/50">
                <div className="w-12 h-12 bg-accent-subtle rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary mb-4">How It Works</h2>
          </div>

          <div className="relative">
            <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border-subtle md:hidden" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                <div key={i} className="relative flex md:flex-col items-start md:items-center gap-6 md:text-center">
                  <div className="relative z-10 w-14 h-14 rounded-full bg-bg-secondary border-2 border-accent-primary/20 flex items-center justify-center flex-shrink-0 text-accent-primary">
                    {step.icon}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-primary text-bg-primary rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                    <p className="text-sm text-text-secondary">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-75">
            <div className="w-6 h-6 bg-text-tertiary rounded-md" />
            <span className="text-sm text-text-secondary">
              © 2024 AI Prediction Market Advisor. All rights reserved.
            </span>
          </div>
          <div className="flex gap-8 text-sm text-text-tertiary">
            <a href="#" className="hover:text-accent-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-accent-primary transition-colors">Discord</a>
            <a href="#" className="hover:text-accent-primary transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}