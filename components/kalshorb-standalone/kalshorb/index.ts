// Kalshorb AI Edge Function - Prediction Market Advisor with OpenRouter + Fallback
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const {
            user_id,
            session_id,
            message,
            action = 'chat',
            include_context = true
        } = await req.json();

        if (!user_id) {
            throw new Error('User ID is required');
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');

        let result;

        switch (action) {
            case 'chat': {
                if (!message || !session_id) {
                    throw new Error('Message and session ID are required');
                }

                // Save user message
                await saveMessage(supabaseUrl, serviceRoleKey, {
                    user_id,
                    session_id,
                    role: 'user',
                    content: message
                });

                // Ensure session exists
                await ensureSession(supabaseUrl, serviceRoleKey, user_id, session_id, message);

                // Fetch context if requested
                let context = null;
                if (include_context) {
                    context = await fetchUserContext(supabaseUrl, serviceRoleKey, user_id);
                }

                // Fetch conversation history
                const history = await getConversationHistory(supabaseUrl, serviceRoleKey, session_id);

                // Try OpenRouter first, fallback to rule-based if it fails
                let aiResponse;
                try {
                    if (openRouterKey) {
                        aiResponse = await generateAIResponse(openRouterKey, message, history, context);
                    } else {
                        aiResponse = generateFallbackResponse(message, context);
                    }
                } catch (apiError) {
                    console.log('OpenRouter API error, using fallback:', apiError);
                    aiResponse = generateFallbackResponse(message, context);
                }

                // Save AI response
                await saveMessage(supabaseUrl, serviceRoleKey, {
                    user_id,
                    session_id,
                    role: 'assistant',
                    content: aiResponse.message,
                    confidence_score: aiResponse.confidence,
                    suggested_actions: aiResponse.suggested_actions,
                    market_context: aiResponse.market_data ? { markets: aiResponse.market_data } : null
                });

                // Update session
                await updateSession(supabaseUrl, serviceRoleKey, session_id, message);

                result = {
                    message: aiResponse.message,
                    confidence: aiResponse.confidence,
                    suggested_actions: aiResponse.suggested_actions,
                    market_data: aiResponse.market_data,
                    session_id
                };
                break;
            }

            case 'quick_action': {
                // Handle predefined quick actions with fallback
                let quickResponse;
                try {
                    if (openRouterKey) {
                        quickResponse = await handleQuickAction(message, openRouterKey);
                    } else {
                        quickResponse = generateFallbackResponse(message, null);
                    }
                } catch {
                    quickResponse = generateFallbackResponse(message, null);
                }
                result = {
                    message: quickResponse.message,
                    confidence: quickResponse.confidence,
                    suggested_actions: quickResponse.suggested_actions,
                    session_id
                };
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Kalshorb error:', error);
        return new Response(JSON.stringify({
            error: { code: 'KALSHORB_ERROR', message: error.message }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Save message to database
async function saveMessage(supabaseUrl: string, serviceRoleKey: string, message: any) {
    const response = await fetch(`${supabaseUrl}/rest/v1/chat_messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            ...message,
            created_at: new Date().toISOString()
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Failed to save message:', error);
    }
}

// Ensure conversation session exists
async function ensureSession(
    supabaseUrl: string,
    serviceRoleKey: string,
    userId: string,
    sessionId: string,
    firstMessage: string
) {
    // Check if session exists
    const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/conversation_sessions?id=eq.${sessionId}`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        }
    );

    const sessions = await checkResponse.json();

    if (!sessions || sessions.length === 0) {
        // Create new session
        const title = firstMessage.length > 50
            ? firstMessage.substring(0, 47) + '...'
            : firstMessage;

        await fetch(`${supabaseUrl}/rest/v1/conversation_sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                id: sessionId,
                user_id: userId,
                title,
                message_count: 1,
                is_archived: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });
    }
}

// Update session metadata
async function updateSession(
    supabaseUrl: string,
    serviceRoleKey: string,
    sessionId: string,
    lastMessage: string
) {
    await fetch(
        `${supabaseUrl}/rest/v1/conversation_sessions?id=eq.${sessionId}`,
        {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                summary: lastMessage.substring(0, 100),
                updated_at: new Date().toISOString(),
                last_message_at: new Date().toISOString()
            })
        }
    );
}

// Get conversation history
async function getConversationHistory(
    supabaseUrl: string,
    serviceRoleKey: string,
    sessionId: string
): Promise<{ role: string; content: string }[]> {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${sessionId}&order=created_at.desc&limit=10`,
        {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
            }
        }
    );

    const messages = await response.json();

    if (!messages || !Array.isArray(messages)) {
        return [];
    }

    return messages.reverse().map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
    }));
}

// Fetch user context
async function fetchUserContext(supabaseUrl: string, serviceRoleKey: string, userId: string) {
    const headers = {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
    };

    const [positionsRes, riskRes, portfolioRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/positions?user_id=eq.${userId}&status=eq.open&limit=5`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/risk_assessments?user_id=eq.${userId}&is_current=eq.true&limit=1`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/portfolios?user_id=eq.${userId}&is_active=eq.true&limit=1`, { headers })
    ]);

    const [positions, riskAssessments, portfolios] = await Promise.all([
        positionsRes.json().catch(() => []),
        riskRes.json().catch(() => []),
        portfolioRes.json().catch(() => [])
    ]);

    return {
        positions: Array.isArray(positions) ? positions : [],
        risk_profile: Array.isArray(riskAssessments) && riskAssessments.length > 0 ? riskAssessments[0] : null,
        portfolio: Array.isArray(portfolios) && portfolios.length > 0 ? portfolios[0] : null
    };
}

// Generate AI response using OpenRouter
async function generateAIResponse(
    apiKey: string,
    userMessage: string,
    history: { role: string; content: string }[],
    context: any
): Promise<{
    message: string;
    confidence: number;
    suggested_actions: any[];
    market_data?: any[];
}> {
    const systemPrompt = buildSystemPrompt(context);

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8),
        { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kalshorb.space.minimax.io',
            'X-Title': 'Kalshorb AI Advisor'
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.95
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || '';

    const { cleanMessage, suggestedActions, confidence } = parseAIResponse(aiMessage, userMessage);

    return {
        message: cleanMessage,
        confidence,
        suggested_actions: suggestedActions
    };
}

// Fallback rule-based response generator
function generateFallbackResponse(
    message: string,
    context: any
): {
    message: string;
    confidence: number;
    suggested_actions: any[];
    market_data?: any[];
} {
    const lower = message.toLowerCase();
    let responseMessage = '';
    let confidence = 80;
    let actions: any[] = [];

    // Prediction Market Basics
    if (lower.includes('what') && (lower.includes('prediction market') || lower.includes('prediction markets'))) {
        responseMessage = `Prediction markets are financial exchanges where participants trade contracts whose payouts depend on the outcomes of future events. 

Here's how they work:

**Core Mechanics:**
- You buy "Yes" or "No" contracts on specific outcomes (e.g., "Will X win the election?")
- Contracts typically pay $1 if correct, $0 if wrong
- Current prices reflect the crowd's probability estimate

**Key Platforms:**
- **Kalshi** - CFTC-regulated, focuses on economic and political events
- **Polymarket** - Crypto-based, broader event coverage
- **PredictIt** - Academic-focused political markets

**Why They Matter:**
- Aggregate diverse information efficiently
- Often more accurate than polls or expert forecasts
- Provide real-time probability updates

Would you like me to explain trading strategies or risk management?`;
        confidence = 92;
        actions = [
            { label: 'Learn Trading Strategies', action: 'learn_strategies' },
            { label: 'Explore Markets', action: 'navigate', path: '/markets' }
        ];
    }
    // Kelly Criterion
    else if (lower.includes('kelly') || (lower.includes('position') && lower.includes('size'))) {
        const kellyFraction = context?.portfolio?.kelly_fraction || 0.5;
        responseMessage = `The Kelly Criterion is a mathematical formula for optimal bet sizing that maximizes long-term growth while managing risk.

**The Formula:**
Kelly % = (p × b - q) / b

Where:
- p = probability of winning
- q = probability of losing (1 - p)
- b = odds received (payout ratio)

**Example:**
If you believe a market has 60% chance but is priced at 50 cents:
- Edge = 0.60 × 1 - 0.40 = 0.20 (20% edge)
- Kelly suggests betting 20% of bankroll

**In Practice:**
- Most traders use "fractional Kelly" (typically 25-50% of full Kelly)
- Your current Kelly fraction is set to ${(kellyFraction * 100).toFixed(0)}%
- This provides a buffer against estimation errors

**Benefits of Fractional Kelly:**
- Reduces volatility significantly
- Protects against overconfidence in probability estimates
- Still captures most of the long-term growth

Would you like me to calculate position sizes for specific markets?`;
        confidence = 88;
        actions = [
            { label: 'Calculate Position Size', action: 'calculate_kelly' },
            { label: 'Adjust Kelly Settings', action: 'navigate', path: '/settings' }
        ];
    }
    // Portfolio Analysis
    else if (lower.includes('portfolio') || lower.includes('positions') || lower.includes('holdings')) {
        const positions = context?.positions || [];
        const portfolio = context?.portfolio;

        if (positions.length === 0) {
            responseMessage = `I don't see any open positions in your portfolio yet. 

**Getting Started:**
1. Browse available markets to find opportunities
2. Use the Kelly Criterion to size your positions appropriately
3. Start with smaller positions to get comfortable with the platform
4. Diversify across different event types to manage risk

**Recommended First Steps:**
- Set your risk tolerance in Settings
- Review AI-generated recommendations
- Start with high-liquidity markets (higher volume = easier entry/exit)

Would you like me to show you some recommended markets based on your risk profile?`;
            actions = [
                { label: 'Get Recommendations', action: 'navigate', path: '/recommendations' },
                { label: 'Browse Markets', action: 'navigate', path: '/markets' }
            ];
        } else {
            const totalValue = positions.reduce((sum: number, p: any) => sum + (p.quantity * p.avg_price), 0);
            responseMessage = `Here's your portfolio overview:

**Current Holdings:**
- ${positions.length} open position${positions.length > 1 ? 's' : ''}
- Estimated value: $${totalValue.toFixed(2)}

**Portfolio Health Tips:**
- Monitor correlation between positions (avoid concentration in similar events)
- Review position sizes relative to your Kelly fraction
- Set mental stop-losses for each position
- Regularly reassess your probability estimates

${portfolio?.pnl_total ? `**Performance:** $${portfolio.pnl_total.toFixed(2)} (${portfolio.pnl_percent?.toFixed(1)}%)` : ''}

Would you like a detailed analysis of any specific position?`;
            confidence = 85;
            actions = [
                { label: 'View All Positions', action: 'navigate', path: '/portfolio' },
                { label: 'Optimize Portfolio', action: 'optimize_portfolio' }
            ];
        }
    }
    // Risk Analysis
    else if (lower.includes('risk') || lower.includes('danger') || lower.includes('safe')) {
        const riskProfile = context?.risk_profile;
        if (riskProfile) {
            const riskLevel = riskProfile.risk_classification || 'moderate';
            responseMessage = `Based on your trading patterns, here's your risk assessment:

**Risk Profile: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}**
- Risk Score: ${riskProfile.risk_score}/100

**What This Means:**
${getRiskExplanation(riskLevel)}

**Risk Management Tips:**
- Never risk more than 1-5% of portfolio on a single trade
- Diversify across uncorrelated events
- Use fractional Kelly sizing
- Set clear exit criteria before entering positions
- Review and adjust regularly

Would you like recommendations aligned with your risk profile?`;
            confidence = 85;
        } else {
            responseMessage = `I don't have enough trading history to fully assess your risk profile yet.

**Building Your Risk Profile:**
As you make trades, I'll analyze your behavior to understand:
- Position sizing preferences
- Risk tolerance patterns
- Trading frequency
- Reaction to market movements

**In the Meantime:**
You can set your preferred risk level in Settings. This helps me provide better recommendations tailored to your comfort level.

**Risk Levels Explained:**
- **Conservative**: Focus on high-probability, lower-return trades
- **Moderate**: Balanced approach with reasonable risk/reward
- **Aggressive**: Higher risk trades with larger potential returns
- **Speculative**: Maximum risk tolerance for experienced traders`;
            confidence = 75;
        }
        actions = [
            { label: 'View Risk Details', action: 'navigate', path: '/analytics' },
            { label: 'Adjust Risk Settings', action: 'navigate', path: '/settings' }
        ];
    }
    // Market Recommendations
    else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('opportunity') || lower.includes('what should')) {
        responseMessage = `Here are my recommendations for finding good prediction market opportunities:

**Key Factors to Evaluate:**

1. **Liquidity** - Higher volume markets allow easier entry/exit
2. **Information Edge** - Do you have insight the market hasn't priced in?
3. **Time to Resolution** - Shorter timeframes mean faster capital turnover
4. **Probability Mispricing** - Look for markets where you disagree with current odds

**Current Market Categories Worth Watching:**
- Political events (elections, policy decisions)
- Economic indicators (inflation, employment data)
- Sports outcomes (if legal in your jurisdiction)
- Technology milestones

**Strategy Tips:**
- Start with markets you understand well
- Compare your probability estimates to market prices
- Calculate expected value before trading
- Consider correlation with your existing positions

Check the Recommendations page for AI-curated opportunities matching your profile.`;
        confidence = 78;
        actions = [
            { label: 'View Recommendations', action: 'navigate', path: '/recommendations' },
            { label: 'Browse All Markets', action: 'navigate', path: '/markets' }
        ];
    }
    // Performance & Analytics
    else if (lower.includes('performance') || lower.includes('return') || lower.includes('profit') || lower.includes('analytics')) {
        const portfolio = context?.portfolio;
        if (portfolio && portfolio.total_value) {
            responseMessage = `Here's your performance summary:

**Portfolio Metrics:**
- Total Value: $${portfolio.total_value.toFixed(2)}
- Total P&L: $${(portfolio.pnl_total || 0).toFixed(2)} (${(portfolio.pnl_percent || 0).toFixed(1)}%)
${portfolio.sharpe_ratio ? `- Sharpe Ratio: ${portfolio.sharpe_ratio.toFixed(2)}` : ''}

**Understanding Your Performance:**
- Sharpe Ratio > 1.0 indicates good risk-adjusted returns
- Track win rate alongside P&L (50% win rate can still be profitable with good sizing)
- Compare returns to a passive benchmark

**Improvement Tips:**
- Review losing trades for patterns
- Assess if position sizes match conviction levels
- Consider if you're overtrading in certain categories`;
            confidence = 88;
        } else {
            responseMessage = `I don't have enough trading data to show detailed performance metrics yet.

**What I'll Track:**
- Win/loss rate and P&L
- Risk-adjusted returns (Sharpe ratio)
- Performance by market category
- Position sizing effectiveness

Start trading to build your performance history!`;
            confidence = 70;
        }
        actions = [
            { label: 'View Full Analytics', action: 'navigate', path: '/analytics' },
            { label: 'View Portfolio', action: 'navigate', path: '/portfolio' }
        ];
    }
    // Kalshi Specific
    else if (lower.includes('kalshi')) {
        responseMessage = `Kalshi is a CFTC-regulated prediction market exchange based in the US.

**Key Features:**
- First legally regulated prediction market in the US
- Contracts on economic, political, and weather events
- Binary yes/no contracts paying $0 or $1
- Real-time trading with order book model

**Popular Market Types:**
- Economic indicators (CPI, unemployment, GDP)
- Federal Reserve decisions (rate changes)
- Political outcomes
- Weather and climate events

**Trading Mechanics:**
- Contracts priced 0-99 cents (representing probability)
- Can buy Yes or No positions
- Limit and market orders available
- Positions can be closed before event resolution

**Tips for Kalshi:**
- Watch the spread between bid/ask
- Higher volume markets have better liquidity
- Economic calendar events often have predictable volume spikes

Would you like me to explain any specific Kalshi market type?`;
        confidence = 90;
        actions = [
            { label: 'Browse Kalshi Markets', action: 'navigate', path: '/markets' },
            { label: 'View Recommendations', action: 'navigate', path: '/recommendations' }
        ];
    }
    // General greeting or default
    else {
        responseMessage = `I'm Kalshorb, your AI advisor for prediction market trading. I'm here to help you make better-informed decisions.

**What I Can Help With:**

📊 **Market Analysis**
- Evaluate prediction market opportunities
- Understand probability pricing and edge

💼 **Portfolio Management**
- Review your positions and allocation
- Optimize for risk-adjusted returns

🎯 **Position Sizing**
- Kelly Criterion calculations
- Fractional betting strategies

📈 **Risk Assessment**
- Analyze your trading patterns
- Provide personalized risk recommendations

📚 **Education**
- Explain prediction market concepts
- Share trading strategies and best practices

What would you like to explore today?`;
        confidence = 85;
        actions = [
            { label: 'Analyze My Portfolio', action: 'analyze_portfolio' },
            { label: 'Get Recommendations', action: 'navigate', path: '/recommendations' },
            { label: 'Learn About Markets', action: 'learn_markets' }
        ];
    }

    return {
        message: responseMessage,
        confidence,
        suggested_actions: actions
    };
}

function getRiskExplanation(riskLevel: string): string {
    switch (riskLevel.toLowerCase()) {
        case 'conservative':
            return `Your conservative approach prioritizes capital preservation. This means:
- Smaller position sizes relative to portfolio
- Focus on higher-probability trades
- Lower expected volatility in returns
- Suitable for steady, consistent growth`;
        case 'moderate':
            return `Your balanced approach seeks reasonable returns with manageable risk. This means:
- Standard position sizing using Kelly fraction
- Mix of high and moderate probability trades  
- Moderate portfolio volatility
- Good for most prediction market participants`;
        case 'aggressive':
            return `Your aggressive approach accepts higher risk for potential higher returns. This means:
- Larger position sizes relative to bankroll
- Willingness to take lower-probability trades
- Higher expected volatility
- Requires strict discipline and risk management`;
        case 'speculative':
            return `Your speculative approach maximizes risk exposure. This means:
- Maximum position sizes
- Comfort with high-variance outcomes
- Significant drawdown risk
- Only suitable for experienced traders with high risk tolerance`;
        default:
            return `Your risk profile helps determine appropriate position sizes and trade selection.`;
    }
}

// Build system prompt for Kalshorb
function buildSystemPrompt(context: any): string {
    let prompt = `You are Kalshorb, an expert AI advisor specializing in prediction markets, with deep knowledge of platforms like Kalshi and Polymarket.

Your expertise includes:
- Prediction market mechanics, pricing, and liquidity analysis
- Risk management and portfolio optimization strategies
- Kelly Criterion for optimal position sizing
- Market analysis and identifying trading opportunities
- Understanding probabilities, expected value, and edge calculation
- Behavioral finance and avoiding common trading biases

Your personality:
- Professional but approachable
- Data-driven and analytical
- Honest about uncertainty and limitations
- Educational when explaining concepts
- Focused on risk-adjusted returns, not gambling

Guidelines:
- Provide actionable insights when possible
- Always consider risk management
- Explain your reasoning clearly
- Use prediction market terminology appropriately
- Avoid definitive price predictions; focus on framework and analysis
- Encourage diversification and proper position sizing

Current date: ${new Date().toISOString().split('T')[0]}`;

    if (context) {
        if (context.portfolio) {
            prompt += `\n\nUser's Portfolio Context:
- Total Value: $${context.portfolio.total_value?.toFixed(2) || 'Unknown'}
- Kelly Fraction: ${((context.portfolio.kelly_fraction || 0.5) * 100).toFixed(0)}%`;
        }

        if (context.risk_profile) {
            prompt += `\n- Risk Classification: ${context.risk_profile.risk_classification || 'Moderate'}
- Risk Score: ${context.risk_profile.risk_score || 50}/100`;
        }

        if (context.positions && context.positions.length > 0) {
            prompt += `\n- Open Positions: ${context.positions.length}`;
        }
    }

    prompt += `\n\nRespond naturally and helpfully. Always emphasize proper risk management.`;

    return prompt;
}

// Parse AI response
function parseAIResponse(
    aiMessage: string,
    userMessage: string
): {
    cleanMessage: string;
    suggestedActions: any[];
    confidence: number;
} {
    const lowerUser = userMessage.toLowerCase();

    let confidence = 78;
    if (lowerUser.includes('how') || lowerUser.includes('what is') || lowerUser.includes('explain')) {
        confidence = 88;
    } else if (lowerUser.includes('should i') || lowerUser.includes('recommend')) {
        confidence = 72;
    } else if (lowerUser.includes('predict') || lowerUser.includes('will')) {
        confidence = 65;
    }

    const suggestedActions = generateSuggestedActions(userMessage);

    return {
        cleanMessage: aiMessage,
        suggestedActions,
        confidence
    };
}

// Generate suggested actions
function generateSuggestedActions(userMessage: string): any[] {
    const lower = userMessage.toLowerCase();
    const actions: any[] = [];

    if (lower.includes('portfolio') || lower.includes('position')) {
        actions.push(
            { label: 'View Portfolio', action: 'navigate', path: '/portfolio' },
            { label: 'Optimize Positions', action: 'optimize_portfolio' }
        );
    } else if (lower.includes('risk') || lower.includes('safe')) {
        actions.push(
            { label: 'Check Risk Profile', action: 'navigate', path: '/analytics' },
            { label: 'Adjust Risk Settings', action: 'navigate', path: '/settings' }
        );
    } else if (lower.includes('market') || lower.includes('opportunity')) {
        actions.push(
            { label: 'Browse Markets', action: 'navigate', path: '/markets' },
            { label: 'View Recommendations', action: 'navigate', path: '/recommendations' }
        );
    } else if (lower.includes('kelly') || lower.includes('size') || lower.includes('allocation')) {
        actions.push(
            { label: 'Calculate Position Size', action: 'calculate_kelly' },
            { label: 'Portfolio Settings', action: 'navigate', path: '/settings' }
        );
    } else {
        actions.push(
            { label: 'Explore Markets', action: 'navigate', path: '/markets' },
            { label: 'View Analytics', action: 'navigate', path: '/analytics' }
        );
    }

    return actions.slice(0, 3);
}

// Handle quick actions
async function handleQuickAction(
    actionType: string,
    apiKey: string
): Promise<{
    message: string;
    confidence: number;
    suggested_actions: any[];
}> {
    const quickPrompts: Record<string, string> = {
        'analyze_portfolio': 'Analyze my current portfolio positions and suggest improvements for risk-adjusted returns.',
        'find_opportunities': 'What prediction markets are currently showing good opportunities based on liquidity and potential edge?',
        'check_risk': 'Review my risk profile and tell me if my current exposure is appropriate.',
        'market_overview': 'Give me a brief overview of the current prediction market landscape.',
        'kelly_sizing': 'Explain how I should size my positions using the Kelly Criterion for my risk level.'
    };

    const prompt = quickPrompts[actionType] || quickPrompts['market_overview'];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kalshorb.space.minimax.io',
            'X-Title': 'Kalshorb AI Advisor'
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct',
            messages: [
                {
                    role: 'system',
                    content: 'You are Kalshorb, an expert AI advisor for prediction markets. Provide a concise, helpful response.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 512
        })
    });

    if (!response.ok) {
        throw new Error('Failed to generate quick action response');
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || 'I apologize, but I couldn\'t process that request. Please try again.';

    return {
        message,
        confidence: 80,
        suggested_actions: generateSuggestedActions(prompt)
    };
}
