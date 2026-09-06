// High-Quality Natural Text-to-Speech (TTS) and Speech-to-Text (STT) Utilities

let cachedVoice = null;

export const initVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  const selectVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Priority 1: Natural / Neural Online English Voices (Edge / Chrome AI voices)
    let best = voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.includes('Natural') || 
        v.name.includes('Online (Natural)') || 
        v.name.includes('Neural') ||
        v.name.includes('Google US English') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('Google UK English Male')
      )
    );

    // Priority 2: Standard high-clarity English voices (Jenny, Aria, Guy, Samantha, Victoria, Daniel)
    if (!best) {
      best = voices.find(v => 
        v.lang.startsWith('en') && (
          v.name.includes('Jenny') || 
          v.name.includes('Aria') || 
          v.name.includes('Guy') || 
          v.name.includes('Samantha') || 
          v.name.includes('Victoria') ||
          v.name.includes('Daniel') ||
          v.name.includes('Karen')
        )
      );
    }

    // Priority 3: Fallback to any English voice
    if (!best) {
      best = voices.find(v => v.lang.startsWith('en'));
    }

    cachedVoice = best || voices[0];
  };

  selectVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = selectVoice;
  }
};

// Initialize voices immediately on load
if (typeof window !== 'undefined') {
  initVoices();
}

export const getNaturalVoice = () => {
  if (!cachedVoice && typeof window !== 'undefined' && window.speechSynthesis) {
    initVoices();
  }
  return cachedVoice;
};

export const speakText = (text, onStart, onEnd) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  try {
    // Clear any queued speech for instant response
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98; // Natural, conversational speech pace
    utterance.pitch = 1.0;  // Balanced human pitch
    utterance.volume = 1.0;

    const voice = getNaturalVoice();
    if (voice) {
      utterance.voice = voice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    
    utterance.onerror = (err) => {
      console.warn("[speech] TTS playback warning:", err);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("[speech] Speech Synthesis failed:", err);
    if (onEnd) onEnd();
  }
};
