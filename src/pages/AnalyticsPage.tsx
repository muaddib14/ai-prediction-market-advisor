import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  Calendar,
  Activity,
  Award,
} from 'lucide-react';

interface PerformanceMetric {
  date: string;
  roi: number;
  cumulative_roi: number;
  pnl: number;
  win_count: number;
  loss_count: number;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalROI: 0,
    winRate: 0,
    totalTrades: 0,
    avgReturn: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  async function loadAnalytics() {
    setLoading(true);
    try {
      // Load trade history
      const { data: trades, error } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', user!.id)
        .order('executed_at', { ascending: true });

      if (error) throw error;

      if (trades && trades.length > 0) {
        // Process trades to calculate performance metrics
        const metrics = processTradeHistory(trades);
        setPerformanceData(metrics);
        calculateStats(metrics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  function processTradeHistory(trades: any[]): PerformanceMetric[] {
    const dailyMetrics = new Map<string, PerformanceMetric>();
    let cumulativeROI = 0;

    trades.forEach((trade) => {
      const date = new Date(trade.executed_at).toISOString().split('T')[0];
      const roi = ((trade.pnl || 0) / (trade.amount || 1)) * 100;
      cumulativeROI += roi;

      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, {
          date,
          roi: 0,
          cumulative_roi: 0,
          pnl: 0,
          win_count: 0,
          loss_count: 0,
        });
      }

      const metric = dailyMetrics.get(date)!;
      metric.roi += roi;
      metric.cumulative_roi = cumulativeROI;
      metric.pnl += trade.pnl || 0;
      
      if ((trade.pnl || 0) > 0) {
        metric.win_count++;
      } else if ((trade.pnl || 0) < 0) {
        metric.loss_count++;
      }
    });

    return Array.from(dailyMetrics.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  function calculateStats(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) return;

    const totalWins = metrics.reduce((sum, m) => sum + m.win_count, 0);
    const totalLosses = metrics.reduce((sum, m) => sum + m.loss_count, 0);
    const totalTrades = totalWins + totalLosses;
    const totalROI = metrics[metrics.length - 1]?.cumulative_roi || 0;
    const avgReturn = totalTrades > 0 ? totalROI / totalTrades : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = metrics.map(m => m.roi);
    const avgDailyReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgDailyReturn / stdDev) * Math.sqrt(252) : 0;

    // Calculate Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    metrics.forEach(m => {
      if (m.cumulative_roi > peak) {
        peak = m.cumulative_roi;
      }
      const drawdown = peak - m.cumulative_roi;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    setStats({
      totalROI,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      totalTrades,
      avgReturn,
      sharpeRatio,
      maxDrawdown,
    });
  }

  const totalWins = performanceData.reduce((sum, m) => sum + m.win_count, 0);
  const totalLosses = performanceData.reduce((sum, m) => sum + m.loss_count, 0);
  const maxROI = Math.max(...performanceData.map(m => m.cumulative_roi), 0);
  const minROI = Math.min(...performanceData.map(m => m.cumulative_roi), 0);
  const maxPnL = Math.max(...performanceData.map(m => Math.abs(m.pnl)), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-h1 text-text-primary">Performance Analytics</h1>
        <p className="text-text-secondary mt-1">
          Track your trading performance and risk-adjusted returns
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Total ROI</span>
            <DollarSign className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${stats.totalROI >= 0 ? 'text-success' : 'text-error'}`}>
              {stats.totalROI >= 0 ? '+' : ''}{stats.totalROI.toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Win Rate</span>
            <Target className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {stats.winRate.toFixed(1)}%
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Total Trades</span>
            <Activity className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {stats.totalTrades}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Avg Return</span>
            <Percent className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${stats.avgReturn >= 0 ? 'text-success' : 'text-error'}`}>
              {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Sharpe Ratio</span>
            <Award className="w-4 h-4 text-accent-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-text-primary">
              {stats.sharpeRatio.toFixed(2)}
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Max Drawdown</span>
            <TrendingDown className="w-4 h-4 text-error" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-error">
              -{stats.maxDrawdown.toFixed(2)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      {loading ? (
        <Card className="p-8">
          <div className="text-center text-text-secondary">Loading analytics...</div>
        </Card>
      ) : performanceData.length > 0 ? (
        <>
          {/* ROI Over Time */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-h4 text-text-primary">ROI Over Time</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Cumulative return on investment
                </p>
              </div>
              <Badge variant="accent">Cumulative</Badge>
            </div>
            <div className="h-[300px] relative">
              <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                {performanceData.slice(-20).map((metric, index) => {
                  const height = maxROI - minROI > 0 
                    ? ((metric.cumulative_roi - minROI) / (maxROI - minROI)) * 100 
                    : 50;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="w-full relative" style={{ height: '100%' }}>
                        <div
                          className="absolute bottom-0 w-full bg-gradient-to-t from-accent-primary to-accent-primary/40 rounded-t transition-all duration-300 group-hover:from-accent-primary group-hover:to-accent-primary/60"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-accent-primary font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {metric.cumulative_roi.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win/Loss Ratio */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-h4 text-text-primary">Win/Loss Ratio</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Distribution of winning vs losing trades
                  </p>
                </div>
                <Badge variant={stats.winRate >= 50 ? 'success' : 'warning'}>
                  {stats.winRate.toFixed(0)}% Win Rate
                </Badge>
              </div>
              <div className="flex flex-col items-center justify-center h-[300px]">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${(totalLosses / (totalWins + totalLosses)) * 251.2} 251.2`}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${(totalWins / (totalWins + totalLosses)) * 251.2} 251.2`}
                      strokeDashoffset={`${-(totalLosses / (totalWins + totalLosses)) * 251.2}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-text-primary">{totalWins + totalLosses}</div>
                    <div className="text-sm text-text-secondary">Total Trades</div>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm text-text-secondary">Wins: <span className="text-text-primary font-mono">{totalWins}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <span className="text-sm text-text-secondary">Losses: <span className="text-text-primary font-mono">{totalLosses}</span></span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Daily P&L */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-h4 text-text-primary">Daily P&L</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Profit and loss distribution by day
                  </p>
                </div>
                <Badge variant="neutral">Risk-Adjusted</Badge>
              </div>
              <div className="h-[300px] relative">
                <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
                  {performanceData.slice(-20).map((metric, index) => {
                    const isPositive = metric.pnl >= 0;
                    const height = (Math.abs(metric.pnl) / maxPnL) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="w-full relative" style={{ height: '100%' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t transition-all duration-300 ${
                              isPositive
                                ? 'bg-gradient-to-t from-success to-success/40 group-hover:from-success group-hover:to-success/60'
                                : 'bg-gradient-to-t from-error to-error/40 group-hover:from-error group-hover:to-error/60'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
                          {new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className={`text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity ${isPositive ? 'text-success' : 'text-error'}`}>
                          ${metric.pnl.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-h4 text-text-primary mb-2">No Trading History</h3>
            <p className="text-text-secondary">
              Start trading to see your performance analytics and insights.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
