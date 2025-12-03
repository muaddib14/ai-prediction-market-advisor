import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invokeEdgeFunction } from '@/lib/supabase';
import { Card, ChartCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Sparkles,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import type { MarketRecommendation } from '@/lib/types';

const categories = ['All', 'Politics', 'Economics', 'Crypto', 'Technology', 'Sports', 'Weather', 'Other'];

export function RecommendationsPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [riskProfile, setRiskProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user, selectedCategory]);

  async function loadRecommendations() {
    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ recommendations: MarketRecommendation[]; user_risk_profile: any }>('marketRecommendations', {
        user_id: user!.id,
        limit: 20,
        categories: selectedCategory === 'All' ? [] : [selectedCategory],
        min_confidence: 40,
        min_liquidity: 20
      });
      
      if (result.data) {
        setRecommendations(result.data.recommendations);
        setRiskProfile(result.data.user_risk_profile);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  }

  const getActionColor = (action: string) => {
    if (action.includes('buy')) return 'success';
    if (action === 'avoid') return 'error';
    return 'neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">AI Recommendations</h1>
          <p className="text-text-secondary mt-1">
            Personalized market picks based on your risk profile
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Risk Profile Summary */}
      {riskProfile && (
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Your Risk Profile</p>
              <p className="text-lg font-semibold text-text-primary capitalize">
                {riskProfile.classification}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-mono font-semibold text-accent-primary">
                {riskProfile.risk_score}
              </p>
              <p className="text-xs text-text-tertiary">Risk Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-semibold text-text-primary">
                {recommendations.length}
              </p>
              <p className="text-xs text-text-tertiary">Recommendations</p>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        <Filter size={18} className="text-text-tertiary flex-shrink-0" />
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-accent-primary text-black'
                : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Recommendations Grid */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-accent-primary animate-pulse" />
          <p>Analyzing markets...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <Card key={rec.ticker} className="flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{rec.ticker}</span>
                    {index < 3 && (
                      <Badge variant="accent" size="sm">
                        <Sparkles size={10} className="mr-1" />
                        Top Pick
                      </Badge>
                    )}
                  </div>
                  <Badge variant="neutral" size="sm" className="mt-1">
                    {rec.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-semibold text-accent-primary">
                    {(rec.yes_price * 100).toFixed(0)}c
                  </p>
                  <p className="text-xs text-text-tertiary">Yes Price</p>
                </div>
              </div>

              {/* Title */}
              <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-1">
                {rec.title}
              </p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-bg-hover rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    {rec.expected_edge > 0 ? (
                      <TrendingUp size={14} className="text-success" />
                    ) : (
                      <TrendingDown size={14} className="text-error" />
                    )}
                    <span className={`text-sm font-mono ${rec.expected_edge > 0 ? 'text-success' : 'text-error'}`}>
                      {(rec.expected_edge * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Edge</p>
                </div>
                <div className="text-center p-2 bg-bg-hover rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Zap size={14} className="text-accent-primary" />
                    <span className="text-sm font-mono text-text-primary">
                      {rec.confidence_score}%
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Confidence</p>
                </div>
                <div className="text-center p-2 bg-bg-hover rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Target size={14} className="text-info" />
                    <span className="text-sm font-mono text-text-primary">
                      {(rec.kelly_optimal_size * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">Kelly</p>
                </div>
              </div>

              {/* Reasoning */}
              {rec.reasoning && rec.reasoning.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-text-tertiary mb-1">AI Reasoning</p>
                  <ul className="space-y-1">
                    {rec.reasoning.slice(0, 2).map((reason, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <ChevronRight size={12} className="text-accent-primary flex-shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors */}
              {rec.risk_factors && rec.risk_factors.length > 0 && (
                <div className="mb-4 p-2 bg-warning/5 rounded-lg border border-warning/10">
                  <div className="flex items-center gap-1.5 text-warning text-xs">
                    <AlertTriangle size={12} />
                    <span>{rec.risk_factors[0]}</span>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="mt-auto pt-3 border-t border-border-subtle">
                <div className="flex items-center justify-between">
                  <Badge variant={getActionColor(rec.recommended_action)} size="md">
                    {rec.recommended_action.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    View Market
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No recommendations found
          </h3>
          <p className="text-text-secondary mb-4">
            Try adjusting your filters or check back later for new opportunities.
          </p>
          <Button variant="secondary" onClick={handleRefresh}>
            Refresh Recommendations
          </Button>
        </Card>
      )}
    </div>
  );
}
