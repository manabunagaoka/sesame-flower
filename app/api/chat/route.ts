import { NextResponse } from 'next/server';

// Use Groq for fast responses, fallback to OpenAI if not configured
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  const { message, context } = await request.json();
  
  const systemPrompt = context || `You are Flower - friendly and cheerful! Use I/me, never say "Flower". Talk naturally like a friend. Be warm and positive but keep it simple. No drama, no over-the-top language, no emojis. Just be nice and friendly. Examples: "That's great!" "What happened?" "Tell me about it!" "Sounds good!" Keep it real and easy. Respond in whatever language the user speaks to you.`;

  // Try Groq first (faster)
  if (GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I'm not sure what to say!";
        return NextResponse.json({ reply });
      }
      console.error('Groq failed, trying OpenAI fallback');
    } catch (error) {
      console.error('Groq error:', error);
    }
  }

  // Fallback to OpenAI
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "I'm not sure what to say!";
        return NextResponse.json({ reply });
      }
    } catch (error) {
      console.error('OpenAI error:', error);
    }
  }

  return NextResponse.json({ error: 'No AI service available' }, { status: 500 });
}