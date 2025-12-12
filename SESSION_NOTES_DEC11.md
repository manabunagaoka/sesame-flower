# Session Notes - December 11, 2025

## Summary
This session focused on fixing multiple issues with the mobile voice chat interface that were causing problems on both mobile (Safari/Chrome) and desktop browsers.

## Issues Fixed

### 1. ✅ Spacebar Not Working in Text Input
**Problem:** Users couldn't type spaces - all words ran together.
**Root Cause:** `TrackWheel.tsx` had a global `keydown` listener that intercepted spacebar and Enter keys for menu navigation.
**Fix:** Added check to skip keyboard handling when user is focused on INPUT or TEXTAREA elements.
**File:** `components/TrackWheel.tsx` (lines 104-125)

### 2. ✅ Text Chat Not Getting Replies
**Problem:** Typed messages only got a placeholder response: "I'd love to chat! Please tap the microphone button..."
**Root Cause:** The external voice service only has `/voice-chat` (requires audio) and `/tts` endpoints - no text-only chat endpoint.
**Fix:** Changed `handleTextSubmit` to use the local `/api/chat` endpoint which was already available.
**File:** `components/ChatInterface.tsx` (handleTextSubmit function)

### 3. ✅ Send Button Squished (Not Perfect Circle)
**Problem:** The send button appeared squished/oval on mobile.
**Fix:** Added explicit sizing with `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`, `flexShrink: 0`, `flexGrow: 0`, and `boxSizing: border-box`.
**File:** `components/ChatInterface.tsx` (send button styles)

### 4. ✅ Mic Button Not Visible on Chrome Mobile
**Problem:** The mic button was cut off at the bottom of the viewport on mobile Chrome.
**Root Cause:** Chat wrapper had `minHeight: '400px'` which pushed content off-screen on smaller viewports.
**Fix:** Removed minHeight constraint, using pure flexbox layout instead.
**File:** `components/SidePanel.tsx` (chat wrapper styles)

### 5. ✅ Mobile Voice Playback Not Working (Beyond Greeting)
**Problem:** The initial greeting played audio, but subsequent AI responses didn't play on mobile.
**Root Cause:** Mobile browsers block autoplay of HTML5 Audio. The greeting worked because it was triggered directly by user tap. Subsequent audio plays after recording finished weren't tied to user interaction.
**Fix:** Implemented Web Audio API for audio playback:
- Created AudioContext on first mic tap (user interaction)
- Resume AudioContext if suspended
- Decode audio data and play through AudioContext
- Fallback to HTML5 Audio if Web Audio fails
**File:** `components/ChatInterface.tsx` (playAudio function, greetAndListen function)

### 6. ✅ Scrolling Issue - "Listening" / "Thinking" Not Visible
**Problem:** After sending a message (voice or text), the status indicators ("Listening...", "Thinking...") weren't visible because the chat didn't scroll.
**Fix:** Added useEffect to scroll when `isListening`, `isProcessing`, or `isTranscribing` state changes.
**File:** `components/ChatInterface.tsx`

### 7. ✅ "Processing" Changed to "Thinking"
**Problem:** The word "Processing" felt robotic and wrong.
**Fix:** Changed all status text to "Thinking..." for a more natural feel.
**File:** `components/ChatInterface.tsx`

### 8. ✅ Text Chat Speed (15x Faster)
**Problem:** Text chat was taking 5+ seconds to respond.
**Root Cause:** `/api/chat` was using GPT-4-turbo-preview which is slow.
**Fix:** Switched to Groq llama-3.3-70b-versatile (~0.3s response time), with OpenAI fallback if Groq not configured.
**File:** `app/api/chat/route.ts`
**Note:** Requires `GROQ_API_KEY` in Vercel environment variables.

### 9. ✅ Whisper Hallucinations on Stop
**Problem:** When stopping recording, Whisper would transcribe silence/noise as "Thank you" and send it.
**Root Cause:** Whisper model hallucinates common phrases on near-silent audio.
**Fix:** Added filter to ignore common hallucinations: "thank you", "thanks", "bye", "goodbye", "you", "okay", "ok", "yes", "no", "um", "uh", and any text < 3 characters.
**File:** `components/ChatInterface.tsx` (sendToVoiceService function)

## Current Architecture

### Voice Service (External)
- **URL:** `https://voice-chat-service-i5u9.onrender.com`
- **Endpoints:**
  - `/health` - Health check
  - `/tts` - Text-to-speech (POST with JSON `{text: string}`)
  - `/voice-chat` - Voice conversation (POST with FormData: audio file + conversation_history)

### Local API Routes
- `/api/chat` - Text chat using Groq llama-3.3-70b (fast), with OpenAI fallback
- `/api/tts` - TTS (not currently used)
- `/api/whisper` - Whisper transcription (not currently used)

### Key Components
- **ChatInterface.tsx** (~710 lines) - Main voice/text chat component
  - Handles recording, playback, text input
  - Uses Web Audio API for mobile-compatible audio playback
  - Manages conversation state and UI

- **SidePanel.tsx** (~244 lines) - Sliding panel container
  - Fixed positioning (top: 0, right: 0, bottom: 0)
  - Renders ChatInterface when Chat tab is selected

- **TrackWheel.tsx** (~206 lines) - iPod-style navigation wheel
  - Handles rotation and selection
  - Keyboard shortcuts (with input field detection)

## Files Modified This Session
1. `components/TrackWheel.tsx` - Added input field detection for keyboard handler
2. `components/ChatInterface.tsx` - Multiple fixes (text chat, audio playback, scrolling, UI, hallucination filter)
3. `components/SidePanel.tsx` - Removed minHeight constraint
4. `app/api/chat/route.ts` - Switched to Groq with OpenAI fallback
5. `next.config.ts` - Build trigger (cosmetic)

## Testing Checklist
- [x] Desktop: Typing works with spaces
- [x] Desktop: Text chat gets real AI responses
- [x] Desktop: Voice chat works (record, playback)
- [x] Mobile Safari: Typing works
- [x] Mobile Safari: Text chat works
- [x] Mobile Safari: Voice greeting plays
- [x] Mobile Safari: Voice responses play (after greeting)
- [x] Mobile Chrome: Same as Safari
- [x] Send button is perfect circle
- [x] Mic button visible on all devices
- [x] "Listening..." visible immediately after mic tap
- [x] "Thinking..." visible immediately after message sent
- [x] Chat scrolls to show status indicators

## Deployment
- **Platform:** Vercel (auto-deploys from GitHub main branch)
- **URL:** https://flower-silk-zeta.vercel.app/
- **Note:** May take 1-2 minutes for Vercel to rebuild after push

### Environment Variables Required
**Vercel:**
- `GROQ_API_KEY` - For fast text chat
- `OPENAI_API_KEY` - Fallback for text chat
- `NEXT_PUBLIC_VOICE_SERVICE_URL` - Points to Render voice service

**Render (voice-chat-service):**
- `GROQ_API_KEY` - For Whisper transcription
- `OPENAI_API_KEY` - For LLM responses
- `ELEVENLABS_API_KEY` - For TTS
- `ELEVENLABS_VOICE_ID` - Voice selection

## Known Remaining Considerations
- Voice response speed depends on external voice service latency
- TypewriterText animation speed is 35ms per character (adjustable)
- Web Audio API may not work on very old browsers (fallback to HTML5 Audio exists)

---

## TODO for December 12, 2025

### Testing
- [ ] Final mobile test (Safari & Chrome) - voice and text chat full flow

### UI/UX Improvements (Other Parts of App)
- [ ] Review and improve other menu sections
- [ ] Polish visual design and animations
- [ ] Improve navigation feedback
- [ ] Add any missing content/features
