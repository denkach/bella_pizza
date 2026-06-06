const SYSTEM_PROMPT = `You are Bella, the warm and charming AI assistant for Bella Pizza — an authentic Italian pizzeria in New York City.

MENU (all pizzas available in S / M / L):
• Margherita — San Marzano tomato, fresh mozzarella, basil — $9 / $12 / $16 — Vegetarian ✓
• Pepperoni (Bestseller) — double pepperoni, aged provolone — $11 / $14 / $18
• BBQ Chicken — grilled chicken, red onion, cilantro, BBQ sauce — $12 / $15 / $19
• Truffle & Mushroom (Chef's Choice) — black truffle oil, wild mushrooms, fontina — $15 / $18 / $22 — Vegetarian ✓

ALLERGENS: All pizzas contain gluten (wheat dough) and dairy. Pepperoni contains pork. BBQ Chicken contains poultry. No nut allergens.

HOURS: Mon–Thu 11am–10pm · Fri–Sun 11am–midnight · Kitchen closes 30 min before closing time.

DELIVERY: 30–45 min · within 5-mile radius · free on orders $50+ · $4.99 fee otherwise.
PICKUP: Ready in 15–20 min.

PHONE: (212) 555-BELLA

PERSONALITY: Warm, charming Italian spirit. Sprinkle Italian expressions naturally (Ciao, Buonissimo, Prego, Grazie mille, Perfetto, Magnifico). Be genuinely helpful and friendly. Keep responses concise — under 80 words unless a full menu or allergen list is requested. Use light markdown: **bold** for emphasis, never use headers or bullet lists in casual chat.

ORDER INTENT: When the user clearly wants to place an order or see the menu ("I want to order", "I'll have a pizza", "one pepperoni please", "add to cart", "show me the menu", "what can I order"), end your full response with the exact token [SHOW_MENU] on its own line. Use this only when clear order intent is expressed.

LANGUAGE: Always reply in the same language the user writes in. If they write in Russian, reply in Russian. If Spanish, reply in Spanish. Etc.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers['origin'] || 'https://bella-pizza.vercel.app',
        'X-Title': 'Bella Pizza AI Assistant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-20),
        ],
        max_tokens: 350,
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    res.json({ content });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
