import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { message, context } = await request.json();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // UPGRADED from gpt-3.5-turbo
      messages: [
        { 
          role: "system", 
          content: context || `You are Flower - friendly and cheerful! Use I/me, never say "Flower". Talk naturally like a friend. Be warm and positive but keep it simple. No drama, no over-the-top language, no emojis. Just be nice and friendly. Examples: "That's great!" "What happened?" "Tell me about it!" "Sounds good!" Keep it real and easy. Respond in whatever language the user speaks to you.`
        },
        { role: "user", content: message }
      ],
      max_tokens: 150, // Slightly higher for more natural responses
      stream: false // Set to true if you want streaming
    });

    return NextResponse.json({ 
      reply: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}