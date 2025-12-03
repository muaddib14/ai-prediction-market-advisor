import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { invokeEdgeFunction } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { ChatMessage, SuggestedAction } from '@/lib/types';

export function AdvisorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadSuggestions();
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm your AI prediction market advisor. I can help you with portfolio analysis, risk assessment, market recommendations, and position sizing using Kelly Criterion. What would you like to know?",
        confidence: 100,
        actions: [
          { label: 'Show My Portfolio', action: 'show_portfolio' },
          { label: 'Get Recommendations', action: 'get_recommendations' },
          { label: 'Analyze My Risk', action: 'analyze_risk' }
        ]
      }]);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadSuggestions() {
    try {
      const result = await invokeEdgeFunction<{ suggestions: string[] }>('aiAdvisor', {
        user_id: user!.id,
        action: 'get_suggestions'
      });
      if (result.data) {
        setSuggestions(result.data.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  async function sendMessage(messageText?: string) {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await invokeEdgeFunction<{
        message: string;
        confidence: number;
        suggested_actions: SuggestedAction[];
        market_context: any;
      }>('aiAdvisor', {
        user_id: user!.id,
        session_id: sessionId,
        message: text,
        action: 'chat'
      });

      if (result.data) {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: result.data.message,
          confidence: result.data.confidence,
          actions: result.data.suggested_actions,
          market_context: result.data.market_context,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I apologize, but I encountered an error processing your request. Please try again.",
          confidence: 0
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting. Please try again.",
        confidence: 0
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleAction(action: SuggestedAction) {
    if (action.action === 'navigate' && action.path) {
      window.location.href = action.path;
    } else {
      sendMessage(action.label);
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-h2 text-text-primary">AI Advisor</h1>
            <p className="text-sm text-text-secondary">Your personal prediction market assistant</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={16} />}
          onClick={() => {
            setMessages([{
              role: 'assistant',
              content: "Chat cleared. How can I help you today?",
              confidence: 100
            }]);
          }}
        >
          Clear Chat
        </Button>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col bg-bg-elevated rounded-2xl border border-border-subtle">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-bg-hover rounded-2xl rounded-br-md'
                      : 'bg-transparent'
                  } p-4`}
                >
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-2">
                    {message.role === 'assistant' ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center">
                          <Sparkles size={14} className="text-accent-primary" />
                        </div>
                        <span className="text-sm font-medium text-accent-primary">AI Advisor</span>
                        {message.confidence !== undefined && message.confidence > 0 && (
                          <Badge variant="accent" size="sm">
                            {message.confidence}% confidence
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-bg-tooltip flex items-center justify-center">
                          <User size={14} className="text-text-secondary" />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">You</span>
                      </>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === 'user' ? 'text-text-primary' : 'text-text-primary'
                  }`}>
                    {message.content}
                  </div>

                  {/* Market Context */}
                  {message.market_context && (
                    <div className="mt-3 p-3 bg-bg-hover rounded-lg border border-border-subtle">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-text-primary">
                            {message.market_context.ticker}
                          </span>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {message.market_context.title}
                          </p>
                        </div>
                        <Badge variant="accent">
                          {message.market_context.confidence}% AI confidence
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Suggested Actions */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleAction(action)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-hover hover:bg-bg-tooltip rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                        >
                          {action.label}
                          <ChevronRight size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center">
                      <Loader2 size={14} className="text-accent-primary animate-spin" />
                    </div>
                    <span className="text-sm text-text-secondary">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border-subtle">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about markets, portfolio, or risk analysis..."
                  className="w-full h-12 px-4 py-3 bg-bg-hover border border-border-default rounded-xl text-text-primary placeholder:text-text-tertiary transition-all focus:outline-none focus:border-accent-primary focus:shadow-glow-sm resize-none"
                  rows={1}
                />
              </div>
              <Button
                variant="primary"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                icon={loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              >
                Send
              </Button>
            </div>
          </div>
        </div>

        {/* Suggestions Panel */}
        <div className="w-64 hidden xl:block">
          <Card className="h-full">
            <h3 className="text-h4 text-text-primary mb-4">Quick Questions</h3>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(suggestion)}
                  className="w-full text-left p-3 bg-bg-hover hover:bg-bg-tooltip rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle">
              <h4 className="text-sm font-medium text-text-primary mb-2">Topics I can help with:</h4>
              <ul className="space-y-1.5 text-xs text-text-tertiary">
                <li>- Portfolio analysis</li>
                <li>- Risk profiling</li>
                <li>- Market recommendations</li>
                <li>- Kelly Criterion sizing</li>
                <li>- Performance tracking</li>
                <li>- Market explanations</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
