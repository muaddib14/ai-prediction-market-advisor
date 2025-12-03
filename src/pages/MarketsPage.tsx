import React, { useEffect, useState } from 'react';
import { invokeEdgeFunction } from '@/lib/supabase';
import { Card, ChartCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Radio,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bookmark,
  BarChart2,
} from 'lucide-react';
import type { Market, Orderbook, Trade } from '@/lib/types';

export function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'liquidity' | 'price'>('volume');
  const [cursor, setCursor] = useState<string | undefined>();

  useEffect(() => {
    loadMarkets();
  }, []);

  useEffect(() => {
    if (selectedMarket) {
      loadMarketDetails(selectedMarket.ticker);
    }
  }, [selectedMarket]);

  async function loadMarkets() {
    setLoading(true);
    try {
      const result = await invokeEdgeFunction<{ markets: Market[]; cursor: string }>('kalshiMarkets', {
        action: 'getMarkets',
        limit: 50,
        status: 'open'
      });
      
      if (result.data) {
        setMarkets(result.data.markets);
        setCursor(result.data.cursor);
        if (result.data.markets.length > 0 && !selectedMarket) {
          setSelectedMarket(result.data.markets[0]);
        }
      }
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarketDetails(ticker: string) {
    try {
      const [orderbookResult, tradesResult] = await Promise.all([
        invokeEdgeFunction<Orderbook>('kalshiMarkets', {
          action: 'getOrderbook',
          ticker
        }),
        invokeEdgeFunction<{ trades: Trade[] }>('kalshiMarkets', {
          action: 'getTrades',
          ticker,
          limit: 20
        })
      ]);

      if (orderbookResult.data) {
        setOrderbook(orderbookResult.data);
      }
      if (tradesResult.data) {
        setTrades(tradesResult.data.trades);
      }
    } catch (error) {
      console.error('Error loading market details:', error);
    }
  }

  const filteredMarkets = markets.filter(m => 
    m.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    if (sortBy === 'volume') return (b.volume || 0) - (a.volume || 0);
    if (sortBy === 'liquidity') return (b.liquidity_score || 0) - (a.liquidity_score || 0);
    if (sortBy === 'price') return b.yes_price - a.yes_price;
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-text-primary">Markets</h1>
          <div className="flex items-center gap-2 mt-1">
            <Radio className="w-3 h-3 text-accent-primary animate-pulse" />
            <p className="text-text-secondary">Real-time prediction market data</p>
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={18} />}
          onClick={loadMarkets}
        >
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Sort by:</span>
          {(['volume', 'liquidity', 'price'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === option
                  ? 'bg-accent-primary text-black'
                  : 'bg-bg-elevated text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market List */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading markets...</div>
          ) : sortedMarkets.length > 0 ? (
            sortedMarkets.map((market) => (
              <div
                key={market.ticker}
                onClick={() => setSelectedMarket(market)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMarket?.ticker === market.ticker
                    ? 'bg-bg-hover border-accent-primary/50 shadow-glow-sm'
                    : 'bg-bg-elevated border-border-subtle hover:border-border-default'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-text-primary">{market.ticker}</span>
                    <Badge variant="accent" size="sm" className="ml-2">{market.category}</Badge>
                  </div>
                  <span className="font-mono text-lg text-accent-primary">
                    {(market.yes_price * 100).toFixed(0)}c
                  </span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-1 mb-2">{market.title}</p>
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span>Vol: {(market.volume || 0).toLocaleString()}</span>
                  <span>Liq: {market.liquidity_score}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-secondary">No markets found</div>
          )}
        </div>

        {/* Market Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMarket ? (
            <>
              {/* Market Header */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-h3 text-text-primary">{selectedMarket.ticker}</h2>
                      <Badge variant="accent">{selectedMarket.category}</Badge>
                      <Badge variant="success" dot>Active</Badge>
                    </div>
                    <p className="text-text-secondary mt-1">{selectedMarket.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" icon={<Bookmark size={16} />}>
                      Watch
                    </Button>
                    <Button variant="primary" size="sm">
                      Trade
                    </Button>
                  </div>
                </div>

                {/* Price Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-success/10 rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">Yes Price</p>
                    <p className="text-3xl font-mono font-bold text-success">
                      {(selectedMarket.yes_price * 100).toFixed(0)}c
                    </p>
                  </div>
                  <div className="p-4 bg-error/10 rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">No Price</p>
                    <p className="text-3xl font-mono font-bold text-error">
                      {(selectedMarket.no_price * 100).toFixed(0)}c
                    </p>
                  </div>
                  <div className="p-4 bg-bg-hover rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">Volume</p>
                    <p className="text-2xl font-mono font-semibold text-text-primary">
                      {(selectedMarket.volume || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-bg-hover rounded-xl">
                    <p className="text-sm text-text-secondary mb-1">AI Confidence</p>
                    <p className="text-2xl font-mono font-semibold text-accent-primary">
                      {selectedMarket.ai_confidence}%
                    </p>
                  </div>
                </div>
              </Card>

              {/* Order Book */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Order Book - YES" className="h-[300px]">
                  {orderbook ? (
                    <div className="space-y-1">
                      {orderbook.yes_bids.slice(-10).reverse().map((level, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div 
                            className="h-6 bg-success/20 rounded"
                            style={{ width: `${Math.min((level.quantity / 100) * 100, 100)}%` }}
                          />
                          <span className="font-mono text-sm text-success w-12">
                            {(level.price * 100).toFixed(0)}c
                          </span>
                          <span className="font-mono text-sm text-text-secondary">
                            {level.quantity}
                          </span>
                        </div>
                      ))}
                      {orderbook.yes_bids.length === 0 && (
                        <p className="text-center text-text-tertiary py-4">No bids</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-text-tertiary py-8">Loading...</div>
                  )}
                </ChartCard>

                <ChartCard title="Order Book - NO" className="h-[300px]">
                  {orderbook ? (
                    <div className="space-y-1">
                      {orderbook.no_bids.slice(-10).reverse().map((level, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div 
                            className="h-6 bg-error/20 rounded"
                            style={{ width: `${Math.min((level.quantity / 100) * 100, 100)}%` }}
                          />
                          <span className="font-mono text-sm text-error w-12">
                            {(level.price * 100).toFixed(0)}c
                          </span>
                          <span className="font-mono text-sm text-text-secondary">
                            {level.quantity}
                          </span>
                        </div>
                      ))}
                      {orderbook.no_bids.length === 0 && (
                        <p className="text-center text-text-tertiary py-4">No bids</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-text-tertiary py-8">Loading...</div>
                  )}
                </ChartCard>
              </div>

              {/* Recent Trades */}
              <ChartCard title="Trade Tape">
                {trades.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {trades.map((trade) => (
                      <div 
                        key={trade.trade_id}
                        className="flex items-center justify-between p-2 bg-bg-hover rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {trade.side === 'yes' ? (
                            <ChevronUp className="w-4 h-4 text-success" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-error" />
                          )}
                          <span className="font-mono text-sm text-text-primary">
                            {(trade.price * 100).toFixed(0)}c
                          </span>
                          <span className="text-sm text-text-secondary">x{trade.count}</span>
                        </div>
                        <span className="text-xs text-text-tertiary">
                          {new Date(trade.created_time).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-text-tertiary py-8">No recent trades</div>
                )}
              </ChartCard>
            </>
          ) : (
            <Card className="text-center py-12">
              <BarChart2 className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
              <p className="text-text-secondary">Select a market to view details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
