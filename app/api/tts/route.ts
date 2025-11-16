import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { text, voice = 'sage', speed = 1.0 } = await request.json();
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Fastest model - optimized for speed
      voice: voice,
      input: text,
      speed: speed // 0.25 to 4.0, default 1.0
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioBase64 = buffer.toString('base64');
    
    return NextResponse.json({ 
      audioUrl: `data:audio/mp3;base64,${audioBase64}` 
    });
  } catch (error) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}