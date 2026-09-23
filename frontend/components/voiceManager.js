/**
 * ============================================================================
 * MODULE: /frontend/components/voiceManager.js
 * 
 * FUNCTION: 
 * The Audio Engine for TAO OS (OUTPUT ONLY).
 * 
 * SAFARI FIX: 
 * Text-to-Speech (TTS) must execute synchronously. Asynchronous voice-loading 
 * and aggressive .cancel() commands trigger Safari's Autoplay Security blocks, 
 * causing permanent silence. This module is now strictly synchronous.
 * ============================================================================
 */

let isUnlocked = false; 

// Force Safari to load voices in the background immediately
if ('speechSynthesis' in window) { 
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); 
} 

export const unlockVoiceEngine = () => { 
    if (!isUnlocked && 'speechSynthesis' in window) { 
        window.speechSynthesis.resume();  
        const silent = new SpeechSynthesisUtterance(''); 
        silent.volume = 0;  
        window.speechSynthesis.speak(silent); 
        isUnlocked = true; 
        console.log('[VoiceManager] Audio engine forcefully unlocked via physical tap.'); 
    } 
}; 

const getBestVoiceForOS = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const hostOS = window.TAO_HARDWARE_CACHE?.hostOS || 'Unknown OS';
    let chosen = null;

    if (hostOS === 'iOS' || hostOS === 'macOS') {
        chosen = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Alex')));
    } else if (hostOS === 'Windows') {
        chosen = voices.find(v => v.name.includes('David') || v.name.includes('Zira'));
    }

    if (!chosen) {
        chosen = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'));
    }

    return chosen;
};

export function speak(text, onComplete) { 
    if (!('speechSynthesis' in window)) {
        if (onComplete) onComplete();
        return;
    }

    // Failsafe: Always attempt to resume a stuck audio context before speaking
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text); 
    const preferredVoice = getBestVoiceForOS();
    
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95; 
    utterance.pitch = 1.0; 

    utterance.onend = () => {
        if (onComplete) onComplete();
    };
    
    utterance.onerror = (e) => {
        console.warn('[VoiceManager] TTS Error:', e);
        if (onComplete) onComplete();
    };

    // Execute immediately. No timeouts.
    window.speechSynthesis.speak(utterance);
}

// Microphones completely disabled for stability
export function listen(onResult, onError) { 
    onError("Listening disabled. Text input only.");
}

export function abortListening() {
    // Disabled
}