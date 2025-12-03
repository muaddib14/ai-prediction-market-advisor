import React, { useEffect, useState, useRef, useCallback } from 'react';
import { invokeEdgeFunction, supabase } from './supabase';

// Mock auth context for standalone demo
const useAuth = () => ({
  user: { id: 'demo-user', walletAddress: 'DemoWallet123' },
  profile: { risk_tolerance: 'moderate', kelly_fraction: 0.5 }
});
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  RefreshCw,
  ChevronRight,
  History,
  Plus,
  MessageSquare,
  TrendingUp,
  PieChart,
  AlertTriangle,
  BookOpen,
  Mic,
  MicOff,
  Copy,
  Check,
  ChevronDown,
  BarChart3,
  Zap,
  Target,
  Settings,
  Trash2,
  X,
} from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
  actions?: SuggestedAction[];
  marketData?: MarketDataCard[];
  chartData?: ChartData;
  isStreaming?: boolean;
}

interface SuggestedAction {
  label: string;
  action: string;
  ticker?: string;
  path?: string;
}

interface MarketDataCard {
  ticker: string;
  title: string;
  price: number;
  change: number;
  volume: number;
  confidence?: number;
}

interface ChartData {
  type: 'portfolio' | 'performance' | 'allocation';
  data: any[];
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

// Quick prompt suggestions
const QUICK_PROMPTS = [
  {
    icon: TrendingUp,
    label: 'Market Analysis',
    prompt: 'What prediction markets are trending right now and worth considering?',
  },
  {
    icon: PieChart,
    label: 'Portfolio Review',
    prompt: 'Review my portfolio and suggest risk adjustments based on my current positions.',
  },
  {
    icon: AlertTriangle,
    label: 'Risk Analysis',
    prompt: 'Analyze the correlation risk in my current prediction market positions.',
  },
  {
    icon: Target,
    label: 'Kelly Sizing',
    prompt: 'Explain Kelly Criterion and calculate optimal position sizes for my portfolio.',
  },
  {
    icon: BookOpen,
    label: 'Learn Basics',
    prompt: 'Explain how prediction markets work and best practices for beginners.',
  },
  {
    icon: BarChart3,
    label: 'Performance',
    prompt: 'How has my portfolio performed this month? Show me detailed analytics.',
  },
];

// Message component with rich content support
function ChatMessage({ 
  message, 
  onActionClick,
  onCopy 
}: { 
  message: Message; 
  onActionClick: (action: SuggestedAction) => void;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUser ? 'bg-bg-hover' : 'bg-accent-subtle border border-accent-primary/20'
      }`}>
        {isUser ? (
          <User size={16} className="text-text-secondary" />
        ) : (
          <Sparkles size={16} className="text-accent-primary" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1.5 ${isUser ? 'justify-end' : ''}`}>
          <span className={`text-sm font-medium ${isUser ? 'text-text-secondary' : 'text-accent-primary'}`}>
            {isUser ? 'You' : 'Kalshorb'}
          </span>
          {message.confidence && message.confidence > 0 && (
            <span className="px-2 py-0.5 text-xs bg-accent-subtle text-accent-primary rounded-full">
              {message.confidence}% confidence
            </span>
          )}
          <span className="text-xs text-text-tertiary">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message Bubble */}
        <div className={`relative group ${
          isUser 
            ? 'bg-bg-hover rounded-2xl rounded-tr-md' 
            : 'bg-transparent'
        } ${isUser ? 'p-4' : 'pr-4'}`}>
          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={14} className="text-accent-primary animate-spin" />
              <span className="text-xs text-text-tertiary">Thinking...</span>
            </div>
          )}

          {/* Message Text */}
          <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Market Data Cards */}
          {message.marketData && message.marketData.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.marketData.map((market, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-bg-hover rounded-lg border border-border-subtle hover:border-accent-primary/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-accent-primary">{market.ticker}</span>
                    {market.confidence && (
                      <span className="text-xs text-text-tertiary">{market.confidence}% AI</span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary font-medium line-clamp-2 mb-2">
                    {market.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono text-text-primary">
                      {(market.price * 100).toFixed(0)}c
                    </span>
                    <span className={`text-sm ${market.change >= 0 ? 'text-success' : 'text-error'}`}>
                      {market.change >= 0 ? '+' : ''}{market.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Copy button (for assistant messages) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-text-primary"
              title="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>

        {/* Suggested Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => onActionClick(action)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-hover hover:bg-bg-tooltip rounded-lg text-sm text-text-secondary hover:text-accent-primary border border-border-subtle hover:border-accent-primary/30 transition-all"
              >
                {action.label}
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Conversation sidebar item
function ConversationItem({ 
  conversation, 
  isActive, 
  onClick, 
  onDelete 
}: { 
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all group ${
        isActive 
          ? 'bg-accent-subtle border border-accent-primary/30' 
          : 'hover:bg-bg-hover border border-transparent'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>
            {conversation.title}
          </p>
          <p className="text-xs text-text-tertiary truncate mt-0.5">
            {conversation.lastMessage}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
        <MessageSquare size={12} />
        <span>{conversation.messageCount} messages</span>
      </div>
    </button>
  );
}

export function KalshorbPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobilePrompts, setShowMobilePrompts] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Initialize with welcome message
  useEffect(() => {
    if (user && messages.length === 0) {
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Welcome to Kalshorb, your AI prediction market advisor. I have access to your portfolio, risk profile, and real-time market data to provide personalized insights.

Here is what I can help you with:
- Analyze prediction markets and identify opportunities
- Review and optimize your portfolio allocations
- Calculate optimal position sizes using Kelly Criterion
- Assess and manage your risk exposure
- Explain prediction market concepts and strategies

What would you like to explore today?`,
        timestamp: new Date().toISOString(),
        confidence: 100,
        actions: [
          { label: 'Analyze My Portfolio', action: 'analyze_portfolio' },
          { label: 'Find Opportunities', action: 'find_opportunities' },
          { label: 'Check Risk Profile', action: 'check_risk' },
        ],
      };
      setMessages([welcomeMessage]);
      loadConversations();
    }
  }, [user]);

  // Load conversation history
  async function loadConversations() {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (data && !error) {
        setConversations(data.map((c: any) => ({
          id: c.id,
          title: c.title || 'New Conversation',
          lastMessage: c.summary || '',
          timestamp: c.updated_at,
          messageCount: c.message_count || 0,
        })));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  // Send message to AI
  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add streaming placeholder
    const streamingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: streamingId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }]);

    try {
      const result = await invokeEdgeFunction<{
        message: string;
        confidence: number;
        suggested_actions: SuggestedAction[];
        market_data?: MarketDataCard[];
        session_id: string;
      }>('kalshorb', {
        user_id: user!.id,
        session_id: sessionId,
        message: text,
        action: 'chat',
        include_context: true,
      });

      // Remove streaming message and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== streamingId);
        if (result.data) {
          return [...filtered, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: result.data.message,
            timestamp: new Date().toISOString(),
            confidence: result.data.confidence,
            actions: result.data.suggested_actions,
            marketData: result.data.market_data,
          }];
        } else {
          return [...filtered, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: "I apologize, but I encountered an issue processing your request. Please try again.",
            timestamp: new Date().toISOString(),
            confidence: 0,
          }];
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== streamingId);
        return [...filtered, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
          confidence: 0,
        }];
      });
    } finally {
      setLoading(false);
    }
  }

  // Handle action click
  function handleAction(action: SuggestedAction) {
    if (action.action === 'navigate' && action.path) {
      window.location.href = action.path;
    } else {
      sendMessage(action.label);
    }
  }

  // Copy to clipboard
  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  // Start new conversation
  function startNewConversation() {
    setSessionId(crypto.randomUUID());
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "Starting a new conversation. What would you like to discuss about prediction markets?",
      timestamp: new Date().toISOString(),
      confidence: 100,
    }]);
    setShowHistory(false);
  }

  // Delete conversation
  async function deleteConversation(id: string) {
    try {
      await supabase
        .from('conversation_sessions')
        .update({ is_archived: true })
        .eq('id', id);
      
      setConversations(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  // Load conversation
  async function loadConversation(id: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (data && !error) {
        setSessionId(id);
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at,
          confidence: m.confidence_score,
          actions: m.suggested_actions,
        })));
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }

  // Handle key press
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Toggle voice recording (placeholder)
  function toggleRecording() {
    setIsRecording(!isRecording);
    // Voice recording would be implemented here with Web Speech API
  }

  return (
    <div className="h-[calc(100vh-80px)] flex animate-fade-in">
      {/* Conversation History Sidebar - Desktop */}
      <div className={`hidden lg:flex flex-col w-72 border-r border-border-subtle bg-bg-primary transition-all ${
        showHistory ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border-subtle">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-black rounded-xl font-semibold hover:brightness-110 transition-all shadow-glow-sm"
          >
            <Plus size={18} />
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare size={32} className="mx-auto text-text-tertiary mb-2" />
              <p className="text-sm text-text-tertiary">No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === sessionId}
                onClick={() => loadConversation(conv.id)}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg">
            <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center">
              <Zap size={16} className="text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {profile?.risk_tolerance || 'Moderate'} Risk
              </p>
              <p className="text-xs text-text-tertiary">
                Kelly: {((profile?.kelly_fraction || 0.5) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-elevated">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="lg:hidden p-2 hover:bg-bg-hover rounded-lg transition-colors"
            >
              <History size={20} className="text-text-secondary" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Kalshorb</h1>
                <p className="text-xs text-text-tertiary">AI Prediction Market Advisor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startNewConversation}
              className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-secondary hover:text-text-primary"
              title="New conversation"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="p-2 hover:bg-bg-hover rounded-lg transition-colors text-text-secondary hover:text-text-primary"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onActionClick={handleAction}
                onCopy={handleCopy}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Quick Prompts - Mobile Toggle */}
        <div className="lg:hidden border-t border-border-subtle">
          <button
            onClick={() => setShowMobilePrompts(!showMobilePrompts)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
          >
            <span>Quick prompts</span>
            <ChevronDown size={16} className={`transition-transform ${showMobilePrompts ? 'rotate-180' : ''}`} />
          </button>
          {showMobilePrompts && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.slice(0, 4).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sendMessage(prompt.prompt);
                    setShowMobilePrompts(false);
                  }}
                  className="flex items-center gap-2 p-3 bg-bg-hover rounded-lg text-left hover:bg-bg-tooltip transition-colors"
                >
                  <prompt.icon size={16} className="text-accent-primary flex-shrink-0" />
                  <span className="text-sm text-text-secondary">{prompt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border-subtle bg-bg-elevated p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-3">
              {/* Voice Input Button */}
              <button
                onClick={toggleRecording}
                className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-error text-white animate-pulse' 
                    : 'bg-bg-hover text-text-secondary hover:text-text-primary hover:bg-bg-tooltip'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about markets, portfolio, or get recommendations..."
                  className="w-full px-4 py-3 bg-bg-hover border border-border-default rounded-xl text-text-primary placeholder:text-text-tertiary resize-none transition-all focus:outline-none focus:border-accent-primary focus:shadow-glow-sm min-h-[48px] max-h-[200px]"
                  rows={1}
                  disabled={loading}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex-shrink-0 p-3 bg-accent-primary text-black rounded-xl font-semibold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-text-tertiary mt-3">
              Kalshorb provides AI-powered insights. Always do your own research before making investment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts Sidebar - Desktop */}
      <div className="hidden xl:flex flex-col w-72 border-l border-border-subtle bg-bg-primary">
        <div className="p-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary">Quick Prompts</h3>
          <p className="text-xs text-text-tertiary mt-1">Click to start a conversation</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(prompt.prompt)}
              className="w-full flex items-start gap-3 p-3 bg-bg-hover hover:bg-bg-tooltip rounded-lg text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-accent-subtle group-hover:bg-accent-primary/20 transition-colors">
                <prompt.icon size={16} className="text-accent-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{prompt.label}</p>
                <p className="text-xs text-text-tertiary line-clamp-2 mt-0.5">{prompt.prompt}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Topics */}
        <div className="p-4 border-t border-border-subtle">
          <h4 className="text-xs font-medium text-text-secondary mb-3">Topics I can help with</h4>
          <div className="flex flex-wrap gap-2">
            {['Portfolio', 'Risk', 'Markets', 'Kelly', 'Strategy', 'Analysis'].map(topic => (
              <span
                key={topic}
                className="px-2 py-1 text-xs bg-bg-hover text-text-tertiary rounded-md"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile History Overlay */}
      {showHistory && (
        <div className="lg:hidden fixed inset-0 z-50 bg-bg-base/90 backdrop-blur-sm">
          <div className="flex flex-col h-full w-80 bg-bg-primary border-r border-border-subtle">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h2 className="text-lg font-semibold text-text-primary">Conversations</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <button
                onClick={startNewConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary text-black rounded-xl font-semibold"
              >
                <Plus size={18} />
                New Conversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === sessionId}
                  onClick={() => loadConversation(conv.id)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
