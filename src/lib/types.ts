// User and Auth Types
export interface User {
  id: string;
  walletAddress: string;
}

export interface Profile {
  id: string;
  user_id: string;
  wallet_address: string;
  full_name: string | null;
  email: string | null;
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | 'speculative';
  kelly_fraction: number;
  max_drawdown_pct: number;
  max_position_size?: number;
  api_key_connected: boolean;
  api_keys?: {
    kalshi?: string;
  };
  notifications_enabled: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at: string;
}

// Risk Assessment Types
export interface RiskAssessment {
  id: string;
  user_id: string;
  risk_score: number;
  risk_classification?: string;
  confidence_score: number;
  behavioral_signals: BehavioralSignals;
  anomaly_flags: AnomalyFlag[];
  volatility_index: number;
  trading_frequency: string;
  assessment_date: string;
  is_current: boolean;
}

export interface BehavioralSignals {
  trading_frequency: string;
  trades_per_day: number;
  avg_position_size: number;
  win_rate: number;
  stake_volatility: number;
  volatility_index: number;
  avg_session_duration_mins: number;
  total_trades: number;
  open_positions: number;
  unique_markets_traded: number;
}

export interface AnomalyFlag {
  type: string;
  severity: 'info' | 'caution' | 'warning' | 'alert';
  message: string;
  value: number;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  total_value: number;
  cash_balance: number;
  pnl_total: number;
  pnl_percent: number;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  allocation_strategy: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  portfolio_id: string;
  user_id: string;
  market_ticker: string;
  market_title: string | null;
  side: 'yes' | 'no';
  quantity: number;
  avg_price: number;
  current_price: number | null;
  unrealized_pnl: number | null;
  realized_pnl: number;
  kelly_weight: number | null;
  correlation_group: string | null;
  status: 'open' | 'closed' | 'settled';
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
}

// Market Types
export interface Market {
  ticker: string;
  title: string;
  subtitle?: string;
  series_ticker: string | null;
  event_ticker: string | null;
  status: string;
  yes_price: number;
  no_price: number;
  yes_ask?: number;
  no_ask?: number;
  volume: number;
  volume_24h?: number;
  open_interest: number;
  liquidity_score: number;
  ai_confidence: number;
  category: string;
  close_time: string | null;
  settlement_time: string | null;
  expiration_time?: string;
  result?: string;
  rules_primary?: string;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
}

export interface Orderbook {
  ticker: string;
  yes_bids: OrderbookLevel[];
  no_bids: OrderbookLevel[];
  spread: number;
  depth: { yes: number; no: number };
  timestamp: string;
}

export interface Trade {
  trade_id: string;
  ticker: string;
  side: string;
  price: number;
  count: number;
  created_time: string;
}

// Recommendation Types
export interface Recommendation {
  id: string;
  user_id: string;
  market_ticker: string;
  market_title: string | null;
  recommendation_type: 'buy_yes' | 'buy_no' | 'sell' | 'hold' | 'avoid';
  confidence: number;
  expected_value: number | null;
  kelly_optimal_size: number | null;
  reasoning: string | null;
  risk_factors: string[];
  supporting_signals: string[];
  expires_at: string | null;
  is_active: boolean;
  user_action: string | null;
  action_at: string | null;
  created_at: string;
}

export interface MarketRecommendation {
  ticker: string;
  title: string;
  category: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity_score: number;
  confidence_score: number;
  recommendation_score: number;
  expected_edge: number;
  recommended_action: string;
  reasoning: string[];
  risk_factors: string[];
  kelly_optimal_size: number;
  close_time: string | null;
}

// Chat Types
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence?: number;
  actions?: SuggestedAction[];
  market_context?: MarketContext | null;
  timestamp?: string;
}

export interface SuggestedAction {
  label: string;
  action: string;
  ticker?: string;
  path?: string;
}

export interface MarketContext {
  ticker: string;
  title: string;
  confidence: number;
}

// Trade History Types
export interface TradeHistory {
  id: string;
  user_id: string;
  portfolio_id: string;
  market_ticker: string;
  market_title: string | null;
  trade_type: 'buy' | 'sell';
  side: 'yes' | 'no';
  quantity: number;
  price: number;
  total_value: number;
  fees: number;
  pnl: number | null;
  trade_source: string;
  ai_recommendation_id: string | null;
  executed_at: string;
}

// Analytics Types
export interface PerformanceMetrics {
  total_return: number;
  total_return_pct: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  profitable_trades: number;
  avg_trade_pnl: number;
}

// Portfolio Optimization Types
export interface KellyAllocation {
  ticker: string;
  title: string;
  category: string;
  estimated_probability: number;
  market_price: number;
  edge: number;
  kelly_weight: number;
  current_allocation: number;
  target_allocation: number;
  recommended_change: number;
  action: 'increase' | 'decrease' | 'hold';
  confidence: number;
}

export interface PortfolioMetrics {
  total_exposure: number;
  weighted_edge: number;
  position_count: number;
  category_count: number;
  diversification_ratio: number;
  estimated_sharpe: number;
}

// Watchlist Types
export interface WatchlistItem {
  id: string;
  user_id: string;
  market_ticker: string;
  market_title: string | null;
  added_price: number | null;
  current_price: number | null;
  alert_price_above: number | null;
  alert_price_below: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
