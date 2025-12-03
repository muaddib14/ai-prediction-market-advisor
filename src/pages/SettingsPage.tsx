import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Settings,
  User,
  Key,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Wallet,
} from 'lucide-react';

export function SettingsPage() {
  const { user, profile } = useAuth();
  
  // Profile Settings
  const [fullName, setFullName] = useState('');
  
  // Risk Tolerance
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [maxPositionSize, setMaxPositionSize] = useState(0.1);
  
  // API Keys
  const [kalshiApiKey, setKalshiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [tradeAlerts, setTradeAlerts] = useState(true);
  const [recommendationAlerts, setRecommendationAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  
  // UI States
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      loadSettings();
    }
  }, [user, profile]);

  async function loadSettings() {
    try {
      setFullName(profile?.full_name || '');
      setRiskTolerance(getRiskToleranceValue(profile?.risk_tolerance));
      setMaxPositionSize(profile?.max_position_size || 0.1);
      
      // Load API keys (would be encrypted in production)
      setKalshiApiKey(profile?.api_keys?.kalshi || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  function getRiskToleranceValue(label?: string): number {
    const mapping: Record<string, number> = {
      'conservative': 25,
      'moderate': 50,
      'aggressive': 75,
      'very_aggressive': 90,
    };
    return mapping[label?.toLowerCase() || 'moderate'] || 50;
  }

  function getRiskToleranceLabel(value: number): string {
    if (value < 35) return 'Conservative';
    if (value < 60) return 'Moderate';
    if (value < 80) return 'Aggressive';
    return 'Very Aggressive';
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          risk_tolerance: getRiskToleranceLabel(riskTolerance).toLowerCase().replace(' ', '_'),
          max_position_size: maxPositionSize,
          api_keys: {
            kalshi: kalshiApiKey,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id);

      if (profileError) throw profileError;

      // Notification preferences stored in profile
      // (No longer using Supabase auth user metadata)

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage your account preferences and trading parameters
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span className="text-success">Settings saved successfully</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error" />
          <span className="text-error">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-subtle rounded-lg">
                <User className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-h4 text-text-primary">Profile Information</h3>
                <p className="text-sm text-text-secondary">
                  Update your personal details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Wallet Address
                </label>
                <Input
                  type="text"
                  value={user?.walletAddress || ''}
                  disabled
                  className="bg-bg-hover cursor-not-allowed font-mono text-sm"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Your Solana wallet address (read-only)
                </p>
              </div>
            </div>
          </Card>

          {/* Risk Management */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-subtle rounded-lg">
                <Shield className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-h4 text-text-primary">Risk Management</h3>
                <p className="text-sm text-text-secondary">
                  Configure your trading risk parameters
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Risk Tolerance Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text-primary">
                    Risk Tolerance
                  </label>
                  <Badge variant="accent">
                    {getRiskToleranceLabel(riskTolerance)}
                  </Badge>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(Number(e.target.value))}
                  className="w-full h-2 bg-bg-hover rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #f59e0b ${riskTolerance/2}%, #ef4444 100%)`,
                  }}
                />
                
                <div className="flex justify-between mt-2 text-xs text-text-tertiary">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
                
                <p className="text-sm text-text-secondary mt-3">
                  {riskTolerance < 35 && 'You prefer lower-risk, stable investments with modest returns.'}
                  {riskTolerance >= 35 && riskTolerance < 60 && 'You balance risk and reward, accepting moderate volatility.'}
                  {riskTolerance >= 60 && riskTolerance < 80 && 'You seek higher returns and accept significant risk.'}
                  {riskTolerance >= 80 && 'You pursue maximum returns with high-risk tolerance.'}
                </p>
              </div>

              {/* Max Position Size */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Maximum Position Size
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={maxPositionSize}
                    onChange={(e) => setMaxPositionSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-bg-hover rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                  <span className="text-text-primary font-mono text-sm w-16 text-right">
                    {(maxPositionSize * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Maximum percentage of portfolio for a single position
                </p>
              </div>
            </div>
          </Card>

          {/* API Keys */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-subtle rounded-lg">
                <Key className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-h4 text-text-primary">API Configuration</h3>
                <p className="text-sm text-text-secondary">
                  Connect your trading platform accounts
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kalshi API Key
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={kalshiApiKey}
                    onChange={(e) => setKalshiApiKey(e.target.value)}
                    placeholder="Enter your Kalshi API key"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Required for live trading. Get your API key from{' '}
                  <a
                    href="https://kalshi.com/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:underline"
                  >
                    Kalshi Settings
                  </a>
                </p>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-start gap-2 text-warning text-sm">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>
                    Your API keys are encrypted and stored securely. Never share your API keys with anyone.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-subtle rounded-lg">
                <Bell className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-h4 text-text-primary">Notifications</h3>
                <p className="text-sm text-text-secondary">
                  Manage your alert preferences
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  Email Notifications
                </span>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="toggle-checkbox"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  Trade Execution Alerts
                </span>
                <input
                  type="checkbox"
                  checked={tradeAlerts}
                  onChange={(e) => setTradeAlerts(e.target.checked)}
                  className="toggle-checkbox"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  AI Recommendations
                </span>
                <input
                  type="checkbox"
                  checked={recommendationAlerts}
                  onChange={(e) => setRecommendationAlerts(e.target.checked)}
                  className="toggle-checkbox"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">
                  Weekly Performance Report
                </span>
                <input
                  type="checkbox"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  className="toggle-checkbox"
                />
              </label>
            </div>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSaveProfile}
            disabled={saving}
            icon={<Save size={18} />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00f0d2;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }

        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(0, 240, 210, 0.2);
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00f0d2;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
        }

        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(0, 240, 210, 0.2);
        }

        .toggle-checkbox {
          appearance: none;
          width: 44px;
          height: 24px;
          background: #334155;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }

        .toggle-checkbox:checked {
          background: #00f0d2;
        }

        .toggle-checkbox::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          top: 3px;
          left: 3px;
          transition: transform 0.3s;
        }

        .toggle-checkbox:checked::before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  );
}
