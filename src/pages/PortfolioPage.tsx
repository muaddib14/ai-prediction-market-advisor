import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invokeEdgeFunction, supabase } from '@/lib/supabase';
import { Card, StatCard, ChartCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  RefreshCw,
  Target,
  Percent,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Portfolio, Position, KellyAllocation, PortfolioMetrics } from '@/lib/types';

export function PortfolioPage() {
  const { user, profile } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allocations, setAllocations] = useState<KellyAllocation[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  async function loadPortfolioData() {
    setLoading(true);
    try {
      // Load portfolio
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true);
      
      if (portfolios && portfolios.length > 0) {
        setPortfolio(portfolios[0]);
      }

      // Load positions
      const { data: positionsData } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'open');
      
      if (positionsData) {
        setPositions(positionsData);
      }

      // Load optimization data
      await runOptimization();
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runOptimization() {
    setOptimizing(true);
    try {
      const result = await invokeEdgeFunction<{
        allocations: KellyAllocation[];
        metrics: PortfolioMetrics;
        settings: any;
      }>('portfolioOptimizer', {
        user_id: user!.id,
        action: 'optimize',
        markets: [],
        kelly_fraction: profile?.kelly_fraction || 0.5,
        max_drawdown: (profile?.max_drawdown_pct || 10) / 100
      });

      if (result.data) {
        setAllocations(result.data.allocations);
        setMetrics(result.data.metrics);
      }
    } catch (error) {
      console.error('Error running optimization:', error);
    } finally {
      setOptimizing(false);
    }
  }

  const totalUnrealizedPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const totalPositionValue = positions.reduce((sum, p) => sum + (p.quantity * p.avg_price), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">Portfolio</h1>
          <p className="text-text-secondary mt-1">
            Manage positions and optimize allocations
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={18} className={optimizing ? 'animate-spin' : ''} />}
          onClick={runOptimization}
          loading={optimizing}
        >
          Optimize
        </Button>
      </div>

      {/* Portfolio Summary */}
      <Card className="bg-gradient-to-r from-bg-elevated to-bg-hover border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary flex items-center justify-center shadow-glow">
              <Briefcase className="w-7 h-7 text-black" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Total Portfolio Value</p>
              <p className="text-4xl font-mono font-bold text-text-primary">
                ${(portfolio?.total_value || 1000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm text-text-secondary">Cash Balance</p>
              <p className="text-xl font-mono font-semibold text-text-primary">
                ${(portfolio?.cash_balance || 1000).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Total P&L</p>
              <div className="flex items-center gap-1">
                {(portfolio?.pnl_total || 0) >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-success" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-error" />
                )}
                <p className={`text-xl font-mono font-semibold ${(portfolio?.pnl_total || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                  {(portfolio?.pnl_total || 0) >= 0 ? '+' : ''}${(portfolio?.pnl_total || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Positions"
          value={positions.length}
          icon={<Layers size={20} />}
          accentColor="accent"
        />
        <StatCard
          label="Unrealized P&L"
          value={Math.abs(totalUnrealizedPnL).toFixed(2)}
          prefix={totalUnrealizedPnL >= 0 ? '+$' : '-$'}
          icon={<TrendingUp size={20} />}
          accentColor={totalUnrealizedPnL >= 0 ? 'success' : 'error'}
        />
        <StatCard
          label="Kelly Fraction"
          value={((profile?.kelly_fraction || 0.5) * 100).toFixed(0)}
          suffix="%"
          icon={<Percent size={20} />}
        />
        <StatCard
          label="Max Drawdown Cap"
          value={profile?.max_drawdown_pct?.toFixed(0) || '10'}
          suffix="%"
          icon={<Target size={20} />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions Table */}
        <ChartCard title="Open Positions" className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading positions...</div>
          ) : positions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Side</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Avg Price</th>
                    <th className="text-right">Value</th>
                    <th className="text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const value = position.quantity * position.avg_price;
                    const pnl = position.unrealized_pnl || 0;
                    return (
                      <tr key={position.id}>
                        <td>
                          <div>
                            <span className="font-medium text-text-primary">
                              {position.market_ticker}
                            </span>
                            {position.market_title && (
                              <p className="text-xs text-text-tertiary truncate max-w-[200px]">
                                {position.market_title}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge 
                            variant={position.side === 'yes' ? 'success' : 'error'}
                            size="sm"
                          >
                            {position.side.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="text-right font-mono">{position.quantity}</td>
                        <td className="text-right font-mono">
                          {(position.avg_price * 100).toFixed(0)}c
                        </td>
                        <td className="text-right font-mono">${value.toFixed(2)}</td>
                        <td className="text-right">
                          <span className={`font-mono ${pnl >= 0 ? 'text-success' : 'text-error'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-text-tertiary" />
              <p className="text-text-secondary mb-2">No open positions</p>
              <p className="text-sm text-text-tertiary">
                Start trading to build your portfolio
              </p>
            </div>
          )}
        </ChartCard>

        {/* Portfolio Metrics */}
        <Card>
          <h3 className="text-h4 text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-accent-primary" />
            Portfolio Metrics
          </h3>
          
          {metrics ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Total Exposure</span>
                <span className="font-mono text-text-primary">${metrics.total_exposure.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Weighted Edge</span>
                <span className={`font-mono ${metrics.weighted_edge >= 0 ? 'text-success' : 'text-error'}`}>
                  {metrics.weighted_edge >= 0 ? '+' : ''}{metrics.weighted_edge.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Position Count</span>
                <span className="font-mono text-text-primary">{metrics.position_count}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Category Count</span>
                <span className="font-mono text-text-primary">{metrics.category_count}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">Diversification</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-primary rounded-full"
                      style={{ width: `${metrics.diversification_ratio}%` }}
                    />
                  </div>
                  <span className="font-mono text-text-primary text-sm">{metrics.diversification_ratio}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-text-secondary">Est. Sharpe Ratio</span>
                <span className="font-mono text-accent-primary">{metrics.estimated_sharpe.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              Run optimization to see metrics
            </div>
          )}
        </Card>
      </div>

      {/* Kelly Allocations */}
      {allocations.length > 0 && (
        <ChartCard title="Kelly Optimal Allocations">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Category</th>
                  <th className="text-right">Est. Prob</th>
                  <th className="text-right">Market Price</th>
                  <th className="text-right">Edge</th>
                  <th className="text-right">Kelly Weight</th>
                  <th className="text-right">Target</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.slice(0, 10).map((alloc) => (
                  <tr key={alloc.ticker}>
                    <td>
                      <span className="font-medium text-text-primary">{alloc.ticker}</span>
                    </td>
                    <td>
                      <Badge variant="accent" size="sm">{alloc.category}</Badge>
                    </td>
                    <td className="text-right font-mono">
                      {(alloc.estimated_probability * 100).toFixed(0)}%
                    </td>
                    <td className="text-right font-mono">
                      {(alloc.market_price * 100).toFixed(0)}c
                    </td>
                    <td className="text-right">
                      <span className={`font-mono ${alloc.edge >= 0 ? 'text-success' : 'text-error'}`}>
                        {alloc.edge >= 0 ? '+' : ''}{(alloc.edge * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right font-mono text-accent-primary">
                      {alloc.kelly_weight.toFixed(1)}%
                    </td>
                    <td className="text-right font-mono">${alloc.target_allocation.toFixed(2)}</td>
                    <td>
                      <Badge 
                        variant={alloc.action === 'increase' ? 'success' : alloc.action === 'decrease' ? 'error' : 'neutral'}
                        size="sm"
                      >
                        {alloc.action.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
