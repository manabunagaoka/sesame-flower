import { NextResponse } from 'next/server';

// Use Groq for fast responses (same as voice service)
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(request: Request) {
  const { message, context } = await request.json();
  
  try {
    const systemPrompt = context || `You are Flower - friendly and cheerful! Use I/me, never say "Flower". Talk naturally like a friend. Be warm and positive but keep it simple. No drama, no over-the-top language, no emojis. Just be nice and friendly. Examples: "That's great!" "What happened?" "Tell me about it!" "Sounds good!" Keep it real and easy. Respond in whatever language the user speaks to you.`;

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
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error response:', errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm not sure what to say!";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}