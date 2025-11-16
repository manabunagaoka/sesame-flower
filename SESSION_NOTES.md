# Development Session Notes - November 16, 2025

## Session Summary
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
