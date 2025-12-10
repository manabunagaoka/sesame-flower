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

# Development Session Notes

## Session - December 8, 2025

### Voice Chat Improvements (Technical)

**Completed:**
- ✅ Initial greeting now speaks with Flower's ElevenLabs voice (via `/tts` endpoint on Render)
- ✅ Added Voice Activity Detection (VAD) - auto-stops recording after 1.5s silence
- ✅ Fixed stream parsing - Flower's text response now appears in chat while audio plays
- ✅ Deployed to Vercel (commits: 22d3684, e7527f9)

**Still Needs Work:**
- 🔲 Conversation still requires tap to stop (VAD may need tuning)
- 🔲 Response takes a few seconds to show text and speak (waits for full response)
- 🔲 Will address in new UI redesign

---

### Major Product Vision Discussion: "Sesame HOME"

**Core Concept:** Flower is the HOME system for families with young kids - like Alexa/Echo Show but designed for Sesame Street families.

**The Flower Metaphor:**
- The menu wheel IS a flower
- Center = Flower AI (always available, like Alexa)
- Petals = 8 main features
- Tapping a petal → Full screen content (no more side panels)
- Back gesture returns to flower

**Target Users:**
- Primary: Parents (they set up, configure, control)
- End users: Kids (they interact with content)
- Parent-first, kid-friendly design

---

### Final 8-Petal Layout (Clockwise from Top)

```
              [Communication]
                    12
                    
     [Market]                [Learning]
         11                      1
         
   [Garden]        🌸          [Videos]
       9                          3
         
     [Activities]            [Games]
          7                      5
                    
              [Nudges]
                    6
```

| Position | Feature | Description |
|----------|---------|-------------|
| 12 (top) | **Communication** | Emergency contacts, family, schools, babysitters - ANCHOR point, always at top |
| 1-2 | **Learning** | Sesame Street English, SEL, educational subscriptions |
| 3 | **Videos** | Sesame content, stories, music videos (Stories + Music consolidated here) |
| 5 | **Games** | Educational games |
| 6 (bottom) | **Nudges** | Daily reminders, routine prompts, school newsletters, AI-powered suggestions - THUMB ZONE for parents |
| 7 | **Activities** | Playdates, events, calendar |
| 9 | **Garden** | Rewards/incentive system (see below) |
| 11 | **Market** | Shopping, coming soon |

**Design Rationale:**
- Communication at 12 = Safety anchor, always findable
- Nudges at 6 = Thumb zone, parents check first
- Right side (1,3,5) = Kid engagement zone (Learning, Videos, Games)
- Left side (7,9,11) = Support/Parent zone (Activities, Garden, Market)

---

### Garden Feature (Rewards System)

**Concept:** Kids grow virtual flowers through positive app engagement

**Growth Stages:**
1. 🌰 Seed → Account created
2. 🌱 Sprout → First week active
3. 🌿 Seedling → Completed first routine
4. 🌷 Bud → 10 learning sessions
5. 🌸 Bloom → 1 month active
6. 🌺 Full Flower → Mastered a skill
7. 💐 Garden → Multiple flowers collected

**Flower Varieties to Collect:**
- 🌻 Sunflower = Learning streaks (Knowledge)
- 🌹 Rose = Communication use (Love/Connection)
- 🌼 Daisy = Completed routines (Responsibility)
- 🌺 Hibiscus = Creative activities (Creativity)
- 🌸 Cherry Blossom = Kindness actions (Character)
- 🪻 Lavender = Calm/mindfulness (Emotional health)

**Earning Growth:**
- Complete routines → Sunshine points
- Watch learning videos → Knowledge drops
- Call family → Love petals
- Play educational games → Brain boost
- Kindness (parent confirms) → Golden stars
- Daily streaks → Streak bonus

**Engagement Hooks:**
- Flowers droop slightly if inactive (gentle, not punishing)
- Flower AI: "I miss you! Want to play?"
- Garden view shows all collected flowers
- Family can "visit" each other's gardens
- Seasonal changes in garden

**Why It Works:**
- Intrinsic motivation (nurturing something alive)
- Visual progress over time
- Ties to "Flower" brand
- Long-term retention (collect them all)
- Family connection features

---

### To-Do / Discuss List for Next Session

**Technical (Voice Chat):**
- [ ] Tune VAD sensitivity for better auto-stop
- [ ] Consider streaming text display (show words as they come)
- [ ] Address in context of new UI redesign

**Design Decisions Needed:**
- [ ] **No emoji icons** → Use Sesame character buttons instead (better branding)
- [ ] **MVP Scope** → How complex to build? What's Phase 1 vs Phase 2?
- [ ] **Language Selection** → When/where does user pick language?
  - First markets: Mexico 🇲🇽, then China 🇨🇳
  - First-run setup? Settings? Per-profile?
  - Does Flower AI speak in selected language?
  - Content availability per language?

**MVP Questions:**
- [ ] Which petals are essential for MVP?
- [ ] Can Garden be simplified for V1? (Just streaks/points, fancy garden later?)
- [ ] What's the minimum viable "Nudges" feature?
- [ ] Communication = just saved contacts, or video calling too?

**Future Considerations:**
- [ ] Parent mode toggle (long-press center?)
- [ ] Per-child profiles
- [ ] Partner/licensee integrations (how do they add to petals?)
- [ ] Offline mode for areas with poor connectivity

---

## Earlier Sessions

---

## Session - November 16-17, 2025

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

---

## Session - December 10, 2025

### Goal: Fix Voice Chat Issues & Polish MVP

### Issues Fixed This Session

#### 1. ✅ Duplicate Key React Error
**Problem:** Console error "Encountered two children with the same key" - messages using `timestamp` as key caused collisions.

**Solution:** 
- Added unique `id` field to `ChatMessage` type
- Created `generateMessageId()` helper function using timestamp + counter
- Updated all `setChatMessages` calls to include unique ID
- Updated React map key to use `message.id`

#### 2. ✅ Flower Losing Conversation Memory
**Problem:** Flower would forget what she said (e.g., after speaking Spanish, said "I didn't say anything yet!")

**Root Causes:**
- Stale closure issue - `chatMessages` was captured at function definition time
- Voice service only used 10 messages of history

**Solutions:**
- Added `chatMessagesRef` to always have latest messages in async callbacks
- Increased history from 10 to 20 messages in both frontend and voice service
- Updated voice service system prompt to explicitly remember context

#### 3. ✅ VAD False Positives (Random Noise Triggering)
**Problem:** Flower was responding to ambient noise, generating nonsense like "Hubsan x4 H501S", "Hi, This is Dorian Please Like and Subscribe"

**Solutions:**
- Increased `SILENCE_THRESHOLD` from 15 to 25
- Increased `SILENCE_DURATION` from 1.5s to 2s  
- Increased `MIN_SPEECH_DURATION` from 0.5s to 0.8s
- Added `MIN_AUDIO_LEVEL_TO_SEND = 20` (peak level check)
- Increased `smoothingTimeConstant` from 0.5 to 0.85
- Increased minimum blob size from 1000 to 3000 bytes
- Added `autoGainControl: true` to mic settings

#### 4. ✅ Stop Button Not Stopping
**Problem:** Pressing stop during listening didn't end the conversation loop.

**Solution:**
- Stop button now sets `conversationActive.current = false`
- Updated `stopConversation()` to properly stop MediaRecorder, audio stream, and all timers
- Added cleanup for all refs

#### 5. ✅ Chat History Clearing on X Close
**Problem:** Closing the side panel with X cleared all chat history.

**Solution:**
- Lifted `chatMessages` state from `ChatInterface` to `page.tsx`
- Passed state down through `SidePanel` to `ChatInterface`
- Added `ChatMessage` type export for proper typing
- Chat now persists across panel open/close

#### 6. ✅ New Chat / Reset Button
**Problem:** No way to start a fresh conversation.

**Solution:**
- Added "New Chat" button with rotate icon at top of chat (when messages exist)
- Clicking stops conversation, clears messages, resets greeting, starts fresh

#### 7. ✅ Duplicate Messages ("Two Flowers Talking")
**Problem:** Same user message and Flower response appearing twice.

**Root Causes:**
- `startFastRecording()` being called multiple times
- `sendToFastVoiceService()` processing same audio twice
- Response parsing loop adding messages multiple times

**Solutions:**
- Added guard in `startFastRecording()` to block if already listening/processing
- Added `isProcessingVoiceRef` guard in `sendToFastVoiceService()`
- Added `transcriptionProcessed` and `responseProcessed` flags in response parsing
- Reset guards in `stopConversation()`

#### 8. ✅ Auto-Scroll Not Working
**Problem:** New messages at bottom hidden under input area.

**Solution:**
- Changed from smooth scroll to direct `scrollTop = scrollHeight`
- Added dual timeout (100ms + 500ms) to handle content settling
- Added more state dependencies to scroll trigger

### Voice Service Updates (voice-chat-service repo)

Updated `main.py` with:
- Improved system prompt for better context retention
- Increased history limit from 10 to 20 messages
- Added debug logging for conversation history
- Increased `max_tokens` from 150 to 200
- Added `temperature: 0.7` for more natural responses

### Known Limitations (MVP)

| Limitation | Description |
|------------|-------------|
| **20 Message Context** | AI only remembers last 20 messages. Older context is "forgotten". Display shows all messages, but AI memory is limited. |
| **No Persistent History** | Chat history only persists during browser session. Refreshing page or closing app loses history. (Future: Store in database with accounts) |
| **Single Conversation** | One conversation at a time. No conversation threads or history list. |
| **English/Spanish Only** | AI supports English and Spanish. Other languages not tested. |
| **VAD Sensitivity** | May still occasionally trigger on loud ambient noise. Works best in quiet environments. |

### Files Modified

**ChatInterface.tsx:**
- Added `ChatMessage` type with `id` field
- Added `generateMessageId()` helper
- Added `chatMessagesRef` for closure fix
- Added `isProcessingVoiceRef` guard
- Improved VAD parameters
- Added transcription/response processing guards
- Added "New Chat" button
- Fixed auto-scroll

**SidePanel.tsx:**
- Added chat state props (`chatMessages`, `setChatMessages`)
- Pass state to ChatInterface

**page.tsx:**
- Added `chatMessages` state at page level
- Import `ChatMessage` type
- Pass chat state to SidePanel

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOWER APP                               │
├─────────────────────────────────────────────────────────────────┤
│  page.tsx (state owner)                                          │
│    └── chatMessages[] ←── persists across panel open/close       │
│         │                                                        │
│         ▼                                                        │
│  SidePanel.tsx                                                   │
│    └── ChatInterface.tsx                                         │
│         ├── VAD (Voice Activity Detection)                       │
│         ├── MediaRecorder (audio capture)                        │
│         └── Audio playback (ElevenLabs TTS)                      │
│                                                                  │
│  Voice Pipeline:                                                 │
│    User speaks → MediaRecorder → WebM blob                       │
│         ↓                                                        │
│    voice-chat-service (Render)                                   │
│         ├── Groq Whisper (STT) → transcription                   │
│         ├── OpenAI GPT-4o-mini (LLM) → response                  │
│         └── ElevenLabs (TTS) → audio stream                      │
│         ↓                                                        │
│    Audio plays → Auto-restart listening (if conversation active) │
└─────────────────────────────────────────────────────────────────┘
```

### Testing Notes

**What Works Well:**
- ✅ Continuous voice conversation (speak → Flower replies → speak again)
- ✅ Stop button properly stops conversation
- ✅ New Chat starts fresh
- ✅ Chat history persists when closing/reopening panel
- ✅ Flower remembers recent context (within 20 messages)
- ✅ Spanish/English language switching
- ✅ Typing animation for Flower's responses
- ✅ User messages in blue bubbles

**Edge Cases to Monitor:**
- Very noisy environments may trigger false positives
- Very long conversations (>20 messages) lose early context
- Network latency affects response time

### Next Steps (Future Sessions)

1. **Accounts & Persistence** - Store chat history in database
2. **Multiple Conversations** - Conversation list/threads
3. **Offline Support** - Cache messages, sync when online
4. **Voice Settings** - Volume control, voice speed adjustment
5. **Push Notifications** - Nudges from Flower
6. **Garden Feature** - Rewards/gamification system

---
