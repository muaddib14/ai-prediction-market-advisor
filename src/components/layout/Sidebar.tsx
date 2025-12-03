import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Lightbulb,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Radio,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { path: '/markets', label: 'Markets', icon: TrendingUp },
  { path: '/advisor', label: 'AI Advisor', icon: MessageSquare },
  { path: '/kalshorb', label: 'Kalshorb AI', icon: Sparkles },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { disconnect } = useWallet();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    await disconnect();
    navigate('/connect');
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-bg-base border-r border-border-subtle z-50 transition-all duration-normal ${
        collapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-border-subtle">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-text-primary">Prediction AI</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Live Indicator */}
      {!collapsed && (
        <div className="px-5 py-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4 text-accent-primary animate-pulse-glow" />
            <span className="text-accent-primary font-medium">Live Markets</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-fast ${
                isActive
                  ? 'bg-bg-hover text-text-primary border-l-[3px] border-accent-primary ml-[-3px]'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
              } ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-border-subtle">
        {user && !collapsed && (
          <div className="px-4 py-2 mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent-primary" />
            <p className="text-sm font-mono text-text-primary">
              {formatWalletAddress(user.walletAddress)}
            </p>
          </div>
        )}
        <button
          onClick={handleDisconnect}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-error transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title={collapsed ? 'Disconnect Wallet' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Disconnect</span>}
        </button>
      </div>
    </aside>
  );
}
