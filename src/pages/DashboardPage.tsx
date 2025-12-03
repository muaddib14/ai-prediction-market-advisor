import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { invokeEdgeFunction } from '@/lib/supabase';
import { Card, StatCard, ChartCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import type { Market, RiskAssessment, Portfolio, Position, MarketRecommendation } from '@/lib/types';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load markets
      const marketsResult = await invokeEdgeFunction<{ markets: Market[] }>('kalshiMarkets', {
        action: 'getMarkets',
        limit: 8,
        status: 'open'
      });
      if (marketsResult.data) {
        setMarkets(marketsResult.data.markets);
      }

      // Load risk assessment
      const riskResult = await invokeEdgeFunction<any>('riskProfiling', {
        user_id: user!.id,
        calculate_profile: false
      });
      if (riskResult.data) {
        setRiskAssessment(riskResult.data);
      }

      // Load recommendations
      const recResult = await invokeEdgeFunction<{ recommendations: MarketRecommendation[] }>('marketRecommendations', {
        user_id: user!.id,
        limit: 3
      });
      if (recResult.data) {
        setRecommendations(recResult.data.recommendations);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (score: number) => {
    if (score < 30) return 'success';
    if (score < 60) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-subtle rounded-full">
            <Radio className="w-3 h-3 text-accent-primary animate-pulse" />
            <span className="text-sm text-accent-primary font-medium">Live</span>
          </div>
          <Link to="/advisor">
            <Button variant="primary" icon={<Sparkles size={18} />}>
              Ask AI Advisor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Value"
          value={portfolio?.total_value?.toFixed(2) || '1,000.00'}
          prefix="$"
          change={portfolio?.pnl_percent || 0}
          icon={<Briefcase size={20} />}
          accentColor="accent"
        />
        <StatCard
          label="Risk Score"
          value={riskAssessment?.risk_score || 50}
          suffix="/100"
          icon={<Activity size={20} />}
          accentColor={getRiskColor(riskAssessment?.risk_score || 50)}
        />
        <StatCard
          label="AI Confidence"
          value={riskAssessment?.confidence_score || 75}
          suffix="%"
          icon={<Zap size={20} />}
          accentColor="accent"
        />
        <StatCard
          label="Open Positions"
          value={positions.length}
          icon={<Target size={20} />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Profile Card */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 text-text-primary">Risk Profile</h3>
            <Badge 
              variant={getRiskColor(riskAssessment?.risk_score || 50)} 
              dot
            >
              {riskAssessment?.risk_classification || profile?.risk_tolerance || 'Moderate'}
            </Badge>
          </div>
          
          {/* Risk Gauge */}
          <div className="relative h-3 bg-bg-hover rounded-full overflow-hidden mb-4">
            <div 
              className="absolute h-full bg-gradient-to-r from-success via-warning to-error rounded-full transition-all duration-slow"
              style={{ width: `${riskAssessment?.risk_score || 50}%` }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Volatility Index</span>
              <span className="text-text-primary font-mono">
                {riskAssessment?.behavioral_signals?.volatility_index?.toFixed(1) || '0.0'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Trading Frequency</span>
              <span className="text-text-primary capitalize">
                {riskAssessment?.behavioral_signals?.trading_frequency || 'Low'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Win Rate</span>
              <span className="text-text-primary font-mono">
                {riskAssessment?.behavioral_signals?.win_rate || 0}%
              </span>
            </div>
          </div>

          {riskAssessment?.anomaly_flags && riskAssessment.anomaly_flags.length > 0 && (
            <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertTriangle size={16} />
                <span>{riskAssessment.anomaly_flags.length} pattern(s) detected</span>
              </div>
            </div>
          )}

          <Link to="/analytics" className="mt-4 block">
            <Button variant="ghost" className="w-full justify-between">
              View Details
              <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>

        {/* AI Recommendations */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h4 text-text-primary">AI Recommendations</h3>
            <Link to="/recommendations">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-text-secondary">Loading recommendations...</div>
            ) : recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <div
                  key={rec.ticker}
                  className="p-4 bg-bg-hover rounded-lg border border-border-subtle hover:border-border-default transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">{rec.ticker}</span>
                        <Badge variant="accent" size="sm">{rec.category}</Badge>
                      </div>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                        {rec.title}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center gap-1">
                        {rec.expected_edge > 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-error" />
                        )}
                        <span className={`font-mono text-sm ${rec.expected_edge > 0 ? 'text-success' : 'text-error'}`}>
                          {(rec.expected_edge * 100).toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary">
                        {rec.confidence_score}% confidence
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge 
                      variant={rec.recommended_action.includes('buy') ? 'success' : 'neutral'}
                      size="sm"
                    >
                      {rec.recommended_action.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-text-tertiary">
                      Kelly: {(rec.kelly_optimal_size * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                No recommendations yet. Trade more to get personalized suggestions.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Live Market Feed */}
      <ChartCard title="Market Snapshot" action={
        <Link to="/markets">
          <Button variant="ghost" size="sm">View All Markets</Button>
        </Link>
      }>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Category</th>
                <th className="text-right">Yes Price</th>
                <th className="text-right">Volume</th>
                <th className="text-right">Liquidity</th>
                <th className="text-right">AI Score</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">
                    Loading markets...
                  </td>
                </tr>
              ) : markets.length > 0 ? (
                markets.map((market) => (
                  <tr key={market.ticker} className="hover:bg-bg-hover cursor-pointer">
                    <td>
                      <div>
                        <span className="font-medium text-text-primary">{market.ticker}</span>
                        <p className="text-xs text-text-tertiary line-clamp-1 max-w-[300px]">
                          {market.title}
                        </p>
                      </div>
                    </td>
                    <td>
                      <Badge variant="accent" size="sm">{market.category}</Badge>
                    </td>
                    <td className="text-right font-mono text-accent-primary">
                      {(market.yes_price * 100).toFixed(0)}c
                    </td>
                    <td className="text-right font-mono text-text-secondary">
                      {market.volume?.toLocaleString() || 0}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-accent-primary rounded-full"
                            style={{ width: `${market.liquidity_score}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-tertiary w-8">
                          {market.liquidity_score}
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <Badge 
                        variant={market.ai_confidence > 70 ? 'success' : market.ai_confidence > 50 ? 'warning' : 'neutral'}
                        size="sm"
                      >
                        {market.ai_confidence}%
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-text-secondary">
                    No markets available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
