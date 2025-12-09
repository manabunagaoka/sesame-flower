# Development Session Notes

## Session - December 7, 2025

### Goal: Fast Voice Chat (Sub-1-Second Response Time)

**Problem**: Current voice chat takes 5-10 seconds per response. Need sub-1-second for Mexico client testing.

### Architecture Built

Created a new **Python FastAPI microservice** on Render for fast voice processing:

**Pipeline:**
1. **Groq Whisper** (STT) - Ultra-fast transcription
2. **OpenAI GPT-4o-mini** (LLM) - Fast responses
3. **ElevenLabs** (TTS) - Flower's custom voice (ID: `rrzs0BJdhYIhIwJxuqwj`)

**Repository**: `voice-chat-service` on GitHub
**Deployed to**: Render at `https://voice-chat-service-i5u9.onrender.com`

### What Was Accomplished

1. ✅ **Created voice-chat-service repo** with FastAPI backend
2. ✅ **Deployed to Render** with environment variables (GROQ_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID)
3. ✅ **Fixed CORS issues** - Changed to `allow_origins=["*"]`
4. ✅ **Fixed Groq error** - Removed unsupported `"language": "auto"` parameter
5. ✅ **Added `/tts` endpoint** - For initial greeting with ElevenLabs voice
6. ✅ **Initial greeting now speaks** with Flower's ElevenLabs voice
7. ✅ **Transcription works** - User speech converts to text
8. ✅ **AI responds with voice** - ElevenLabs audio plays back

### What Still Needs Work (Tomorrow's To-Do)

1. 🔲 **Flower types what she says** 
   - AI response text not appearing in chat, only audio plays
   - Need to fix stream parsing in `sendToFastVoiceService` to capture `{"type": "response", "text": "..."}`

2. 🔲 **Continuous conversation flow**
   - Currently must tap "Stop" after each utterance
   - Need Voice Activity Detection (VAD) or silence detection
   - Flow should be: Tap once → speak → auto-detect silence → send → Flower replies → auto-listen again

3. 🔲 **Clean exit from voice mode**
   - Need clear way to end conversation loop (double-tap or dedicated button)

### Files Modified

**flower repo (Next.js frontend):**
- `components/ChatInterface.tsx` - Added fast voice service integration, ElevenLabs greeting, conversation mode

**voice-chat-service repo (Python backend):**
- `main.py` - FastAPI service with `/health`, `/tts`, `/voice-chat` endpoints
- `requirements.txt` - Dependencies (fastapi, uvicorn, httpx, python-multipart, pydantic)

### Security Update (Earlier Today)

- Upgraded Next.js from 15.5.3 to 15.5.7 for CVE-2025-55182

---

# Previous Session Notes - November 16-17, 2025

## Latest Update - November 17, 2025

### ✅ RESOLVED: Browser Compatibility Issue

**Problem Identified (November 16 evening)**:
Voice chat and video playback stopped working on iPhone after UI changes made in morning session.

**Testing Results**:
- ✅ **Working**: Safari browser (both regular and PWA mode) - ALL features functional
- ❌ **Not Working**: Chrome browser (both regular and PWA mode) - Voice and video broken

**Root Cause Confirmed**: 
- Chrome on iOS does **NOT** support Web Speech API (`webkitSpeechRecognition`) in PWA mode
- Safari on iOS has full API support for:
  - Web Speech API (voice recognition)
  - AudioContext (audio playback)
  - Video playback with proper controls
- Chrome PWA appeared to work temporarily in morning session, likely due to:
  - Cached state from previous Safari testing
  - iOS revoking API access after app restart
  - Chrome's limited iOS WebKit wrapper restrictions

**Final Solution**:
1. **Use Safari for iOS PWA** (Chrome is not supported)
2. To switch from Chrome PWA to Safari PWA:
   - Delete Chrome PWA icon from home screen
   - Open Vercel site in **Safari browser**
   - Tap Share → "Add to Home Screen"
   - Use Safari-based PWA going forward

**Code Status**: 
- ✅ All code working correctly (confirmed via commit a04e85d comparison and Safari testing)
- ✅ UI improvements successfully deployed:
  - MessageCircleHeart icon (replaced Flower2)
  - Elegant shadows (replaced gray backgrounds)
  - Redesigned chat input (separate mic/keyboard buttons)
  - Removed duplicate headers
- ✅ No code changes needed - it was a browser limitation, not a code issue

**For CEO Presentation** (IMPORTANT):
- ✅ Ensure PWA is installed from **Safari browser** on iPhone (not Chrome)
- ✅ Test before presentation: Open in Safari → Add to Home Screen → Launch PWA
- ✅ All features work: Voice chat, video playback, text chat
- ⚠️ Chrome on iOS is NOT supported for voice/video features

---

## Session History - November 16, 2025 Morning/Evening

---

## Earlier Session Summary
Fixed critical iOS compatibility issues for video playback and voice chat functionality in the "123 Sesame Street" PWA app.

## Problems Identified
1. **Video Regression**: Videos stopped playing on iPhone after parameter changes
2. **Voice Recognition**: Working - transcribes speech to text successfully
3. **Voice Playback (TTS)**: Not working - audio wouldn't play on iOS despite working on desktop

## Root Causes
- **iOS Autoplay Restrictions**: Audio elements must be created during user interaction
- **Video Parameters**: Simplified iframe parameters removed essential iOS compatibility settings
- **AudioContext Limitations**: iOS requires explicit audio unlocking and error handling

## Solutions Implemented

### 1. Video Fix
**File**: `app/page.tsx`
- Restored working iframe parameters: `playsinline=1&controlsVisibleOnLoad=true&playerColor=54bb6a&plugin%5BpostRoll-v1%5D%5Btext%5D=&volume=1`
- These parameters are essential for iOS video playback in PWA mode

### 2. Voice/Audio Fixes
**File**: `components/ChatInterface.tsx`

#### AudioContext Error Handling
- Added try/catch wrapper around AudioContext initialization
- Prevents crashes when AudioContext creation fails on older devices

#### iOS Audio Playback Strategy
- **Pre-create Audio element** during user interaction (mic button press)
- **Reuse the same Audio element** for all TTS playback
- **Key technique**: Set `audio.src` and call `load()` before playing
- This bypasses iOS autoplay restrictions since the element was created during user tap

```typescript
// Audio element created when mic button pressed
if (!audioRef.current) {
  audioRef.current = new Audio();
  // Set up event handlers once
}

// Later, for each TTS response:
audio.src = data.audioUrl;
await audio.load();
await audio.play();
```

## Git Commits
1. `a7a630d` - "Fix video regression and improve AudioContext error handling"
   - Added try/catch for AudioContext initialization
   
2. `a04e85d` - "Fix iOS audio playback - initialize Audio element on user interaction"
   - Pre-create Audio element on mic button press
   - Reuse audio element for all TTS playback
   - Restored working video parameters

## Current Status ✅

### Working Features
- ✅ Videos play with audio on iPhone
- ✅ Voice recognition captures and transcribes speech
- ✅ TTS plays back on iPhone (Sage voice at 1.05x speed)
- ✅ Continuous conversation flow (speak → AI responds with voice → listen again)
- ✅ PWA mode works correctly on iPhone

### Technology Stack
- **Framework**: Next.js 15.5.3 with Turbopack
- **APIs**: 
  - OpenAI GPT-4-turbo-preview (chat)
  - OpenAI TTS tts-1 (Sage voice, 1.05x speed)
  - Web Speech API (webkitSpeechRecognition)
- **Video**: Wistia embeds (5 videos in Learning section)
- **Deployment**: Vercel (auto-deploy from GitHub main branch)

### Repository Info
- **Repo**: manabunagaoka/flower
- **Branch**: main
- **Latest Deploy**: Commit a04e85d

## Security Notes
- ✅ `.env.local` is properly excluded via `.gitignore` (`.env*` pattern)
- ✅ OpenAI API key never committed to repository
- ✅ API key only exists in local dev environment and Vercel environment variables

## Next Steps / Future Improvements
1. Consider migrating from Web Speech API to OpenAI Whisper for more reliable mobile voice recognition
   - Whisper endpoint already created at `/app/api/whisper/route.ts`
   - Would require MediaRecorder implementation
   
2. Monitor for any iOS-specific edge cases during extended testing

3. Potential enhancements:
   - Volume controls for TTS
   - Voice activity detection for better conversation flow
   - Offline mode support for PWA

## Testing Checklist for Tomorrow
- [ ] Test video playback across different videos
- [ ] Test voice conversation with multiple exchanges
- [ ] Test switching between text and voice input
- [ ] Test app behavior after phone lock/unlock
- [ ] Test with poor network conditions
- [ ] Test PWA install/uninstall flow

## Development Environment
- Container: Ubuntu 24.04.3 LTS
- Local URL: http://localhost:3000
- Production URL: [Vercel deployment - check Vercel dashboard]
