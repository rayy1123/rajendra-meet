---
name: voicebox
description: Audio generation, voice synthesis orchestration, acoustic sound cues, and speech accessibility design.
---

# Voicebox — Audio, Speech & Sonic Feedback Architecture

Guidelines and tooling for sonic micro-interactions, text-to-speech accessibility, and web audio synchronization.

## Capabilities & Patterns
1. **Auditory Micro-Interactions**:
   - Web Audio API synthesizers for tactical feedback (race start beeps, finish touches, error alerts).
   - Non-blocking audio cues using HTML5 `<audio>` / AudioContext with user-gesture gates.
2. **Speech Synthesis (TTS) & Screen Reader Compatibility**:
   - `window.speechSynthesis` integration for lane announcer calls, medal podium announcements, and DQ alerts.
   - Multilingual voice selection with locale fallback (`id-ID`, `en-US`).
3. **Sound Design Constraints**:
   - Sound triggers must be opt-in / muteable with persistent localStorage preferences.
   - Frequency ranges: Keep UI feedback within comfortable 440Hz - 880Hz sine/triangle waves.
