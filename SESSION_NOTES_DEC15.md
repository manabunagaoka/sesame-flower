# Session Notes - December 15, 2025

## Summary
This session focused on debugging voice greeting issues on iOS Safari/Chrome and improving the silence detection to handle Whisper hallucinations more gracefully.

## Issues Investigated

### 1. 🔄 Voice Greeting Not Playing on iOS (Initial Issue)
**Problem:** Voice greeting worked on desktop but not on iPhone Safari or Chrome.

**Investigation:**
- Confirmed ElevenLabs TTS service was working (tested via curl - 200 response, valid audio)
- Confirmed voice service on Render was awake and responding quickly (~0.4s)
- Root cause was NOT the API - it was iOS autoplay restrictions

**Attempted Fixes:**
- Added silent audio buffer unlock on AudioContext creation
- Added `onTouchStart` and `onClick` handlers to unlock audio on first touch
- Added base64 silent MP3 to unlock HTML5 Audio path
- Added 60-second timeout for Render cold start scenarios

**Resolution:** User discovered iPhone **mute switch was on** (ringer/silent switch on side of phone). Once turned off, audio played.

**Lesson Learned:** Always check hardware mute switch on iOS before debugging software audio issues!

### 2. 🔊 Volume Inconsistency Between Greeting and Conversation
**Problem:** Initial greeting played at ~90% volume while conversation responses played at ~50% volume, causing speaker distortion.

**Root Cause Analysis:**
- iOS has separate volume controls:
  - **Ringer volume** (controlled by side switch + buttons when no media playing)
  - **Media volume** (controlled by buttons when media IS playing)
- The greeting may establish a different volume context than subsequent audio
- Web Audio API GainNode should normalize this, but iOS behavior varies

**Changes Made:**
- Lowered GainNode gain from 0.3 → 0.15 → **0.10** (10%)
- Applied consistent volume to:
  - `playAudio()` function (Web Audio API path)
  - `playAudio()` function (HTML5 Audio fallback)
  - `greetAndListen()` function (greeting audio)

**Current Status:** Volume set to 10%. User manually adjusted system volume to match. Further investigation needed to ensure greeting and conversation use same volume context.

**TODO:** Investigate iOS-specific audio session handling to ensure consistent volume between greeting and conversation.

### 3. 🌍 Foreign Language Hallucinations on Silence
**Problem:** When mic was left on during silence, Whisper would hallucinate foreign language phrases (Norwegian "Takk for at", Spanish "Gracias", etc.) and Flower would respond in that language.

**Root Cause:** Whisper model hallucinates common phrases when processing near-silent audio. These are often YouTube outro phrases in various languages.

**Solution Implemented:**
1. **Expanded hallucination filter** to include 40+ phrases in multiple languages:
   - English: "thank you", "thanks", "bye", "subscribe", etc.
   - Norwegian/Swedish: "takk", "takk för", "hej då"
   - Spanish: "gracias", "adiós", "hasta luego"
   - German: "danke", "tschüss", "auf wiedersehen"
   - French: "merci", "au revoir"
   - Portuguese, Italian, Dutch, Russian, Chinese, Japanese, Korean

2. **Smart silence detection** - After 2 consecutive silences/hallucinations:
   - Flower prompts user with helpful message instead of responding to hallucination
   - Message is localized based on recent conversation language:
     - English: "Hey, are you still there? If you want to chat, I'm here! Or press stop when you're done - it's good for the planet! 🌱"
     - Spanish: "¿Hola? ¿Sigues ahí? Si quieres platicar, aquí estoy..."
     - Japanese: "もしもし？まだいますか？..."
     - Chinese: "喂？你还在吗？..."
   - Conversation stops automatically - user must tap mic to restart

### 4. 🛑 Stop Button Not Stopping Audio
**Problem:** Pressing stop while Flower was speaking didn't stop the audio - conversation continued.

**Root Cause:** Code was pausing HTML5 Audio element but NOT stopping the Web Audio API source node.

**Fix:**
- Added `audioSourceRef` to track active Web Audio source
- Updated `stopAll()` to call `audioSourceRef.current?.stop()`
- Updated `handleMicClick()` isSpeaking case to stop Web Audio source

## Testing Checklist for Voice Chat

### Pre-Test Setup (iOS)
- [ ] **Check mute switch** - Ensure the physical mute switch on side of iPhone is OFF (no orange showing)
- [ ] **Check media volume** - Play any audio/video and adjust volume buttons to desired level
- [ ] **Check Do Not Disturb** - Ensure DND is off or allows audio

### Test Flow
1. [ ] Open app in Safari/Chrome on iOS
2. [ ] Tap Flower center to open chat panel
3. [ ] Tap mic button
4. [ ] **Greeting should play** - "Hi! How are you doing? What's on your mind?"
5. [ ] Say something and wait for response
6. [ ] **Response should play at same volume as greeting**
7. [ ] Press stop button
8. [ ] **Audio should stop immediately**
9. [ ] Leave mic on without speaking (test silence detection)
10. [ ] **After ~2 silences, Flower should prompt** about being still there

### Desktop Test Flow
1. [ ] Open app in browser
2. [ ] Click Flower center
3. [ ] Click mic button
4. [ ] Verify greeting plays
5. [ ] Test conversation flow
6. [ ] Test stop button

## Files Modified This Session

1. **components/ChatInterface.tsx**
   - Added `silenceCountRef` for tracking consecutive silences
   - Expanded hallucination filter (40+ phrases, multiple languages)
   - Added smart silence prompt with language detection
   - Lowered volume to 10% (was 30%)
   - Added `audioSourceRef` for proper stop functionality
   - Added detailed logging for debugging

## Commits Made

```
490462b - Lower volume to 10% for better iOS compatibility
daf23e1 - Add smart silence detection - Flower prompts user after 2 consecutive silences
0345135 - Lower volume to 15% and expand hallucination filter for foreign languages
2a05942 - Expand hallucination filter to include foreign language phrases
13dfb72 - Add aggressive iOS audio unlock on first touch/click of chat panel
7eb62aa - Add silent audio unlock for iOS Safari autoplay restrictions
16a3c02 - Fix stop button not stopping audio - properly stop Web Audio source node
ca17b12 - Add detailed logging to voice greeting for debugging
0442845 - Replace event card emojis with Lucide icons (Sparkles, Calendar, Wallet)
```

## Known Issues / Future Work

1. **iOS Volume Consistency** - Greeting and conversation may use different volume contexts on iOS. Need to investigate iOS audio session API or alternative approaches.

2. **Silence Detection Tuning** - Current threshold is 2 consecutive silences. May need adjustment based on user feedback.

3. **Render Cold Start** - Voice service on Render free tier sleeps after 15 minutes of inactivity. First request can take 30-60 seconds. Added 60-second timeout but user experience could be improved with a "warming up" indicator.

## Architecture Reference

### Audio Flow
```
User taps mic
    ↓
AudioContext created/resumed (user gesture required on iOS)
    ↓
greetAndListen() → fetch TTS from Render → playAudio()
    ↓
playAudio() → Web Audio API with GainNode (0.10) → speakers
    ↓ (fallback)
playAudio() → HTML5 Audio with volume 0.10 → speakers
```

### Voice Service
- **URL:** `https://voice-chat-service-i5u9.onrender.com`
- **TTS Endpoint:** POST `/tts` with `{text: string}`
- **Voice Chat Endpoint:** POST `/voice-chat` with FormData (audio + history)
- **TTS Provider:** ElevenLabs (custom Flower voice)

## Environment Variables

**Vercel (flower app):**
- `GROQ_API_KEY` - Fast text chat
- `OPENAI_API_KEY` - Fallback
- `NEXT_PUBLIC_VOICE_SERVICE_URL` - Points to Render

**Render (voice-chat-service):**
- `GROQ_API_KEY` - Whisper transcription
- `OPENAI_API_KEY` - LLM responses
- `ELEVENLABS_API_KEY` - TTS
- `ELEVENLABS_VOICE_ID` - Flower's voice
