import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('No audio file in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // OpenAI Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    // iOS Safari typically outputs webm or mp4
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text', // Get plain text response
    });

    console.log('Transcription result:', transcription);
    
    // response_format: 'text' returns string directly
    const text = typeof transcription === 'string' ? transcription : transcription.text;
    
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Whisper API error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      type: error?.type
    });
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error?.message },
      { status: 500 }
    );
  }
}
