// File: /frontend/bootstrap.js

/**
 * ============================================================================
 * MODULE: /frontend/bootstrap.js
 * 
 * FUNCTION: 
 * The Pre-Flight Hardware Sensor. Detects hardware environment, bypasses 
 * audio firewalls, detects user localization, and initializes the Window Manager.
 * 
 * ARCHITECTURE DETAILS:
 * - Lobotomized Layout: Sizing math delegated strictly to screensize.js.
 * - Non-Blocking Telemetry: OS logs dispatch asynchronously to avoid boot lag.
 * - Idempotent Audio: Hardware lock enforces single-execution audio bypass.
 * - Live Localization: Fetches local language JSON dictionaries prior to UI 
 *   render, with a global override function for login screen interactions.
 * ============================================================================
 */

import { unlockVoiceEngine } from './components/voiceManager.js';
import { initWindowManager } from './components/windowmanager.js';

export const AppBootstrap = {
    async init() {
        console.log(`[Bootstrap] Initializing TAO Engine...`);
        
        try {
            // >>> THE SMART DETECTOR (Hardware footprint only) <<<
            const rawWidth = window.innerWidth;
            const rawHeight = window.innerHeight;
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) || rawWidth <= 768;
            const detectedEnv = isMobileDevice ? 'mobile' : 'desktop';
            
            console.log(`[Bootstrap] Environment trapped: ${detectedEnv}`);
            window.TAO_ENV = detectedEnv; 

            // Dispatch hardware state in the background (Non-blocking)
            this.dispatchLog(`Hardware Footprint Trapped: ${rawWidth}px x ${rawHeight}px (${detectedEnv})`);

            // 1. Initialize Core Engines (Language MUST be awaited before UI builds)
            await this.initLanguageEngine();
            this.initVoiceEngine();
            
            // 2. Activate the Traffic Controller
            console.log(`[Bootstrap] Activating Window Manager...`);
            initWindowManager();
            
            return true; 

        } catch (error) {
            console.error('[Bootstrap] FATAL BOOT ERROR:', error);
            this.dispatchLog(`FATAL BOOT ERROR: ${error.message}`, 'error');
            return false;
        }
    },

    // ==========================================
    // >>> OS SYSTEM LOGGER UTILITY <<<
    // ==========================================
    async dispatchLog(message, logType = 'info') {
        const payload = {
            moduleName: 'bootstrap.js',
            message: message,
            type: logType,
            timestamp: new Date().toLocaleString()
        };

        // 1. Broadcast to Live Telemetry
        window.dispatchEvent(new CustomEvent('TAO_LIVE_LOG', { detail: payload }));

        // 2. Persist to AWS Database
        try {
            await fetch('/api/system/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module_name: payload.moduleName,
                    message: payload.message,
                    log_type: payload.type
                })
            });
        } catch (err) {
            console.warn('[Bootstrap] Failed to write to AWS System Log:', err);
        }
    },

    async initLanguageEngine() {
        const installedLanguages = [
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Español' },
            { code: 'zh', name: '中文' },
            { code: 'fr', name: 'Français' },
            { code: 'ja', name: '日本語' }
        ];

        // 1. Check for saved user preference; fallback to hardware default
        const savedLang = localStorage.getItem('tao_locale');
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
        const activeLang = savedLang || browserLang;

        window.TAO_LOCALE = {
            browserDefault: browserLang,
            installed: installedLanguages,
            active: activeLang 
        };

        this.dispatchLog(`Language engine engaged. Target Locale: ${activeLang}`);

        // 2. Fetch the corresponding dictionary BEFORE continuing the boot sequence
        await this.loadLanguageDictionary(activeLang);

        // 3. Expose global method for UI switching (e.g., inside login.js)
        window.TAO_CHANGE_LANGUAGE = async (newLang) => {
            // Do not re-fetch if the user clicked the language that is already loaded
            if (newLang === window.TAO_LOCALE.active) return;
            
            this.dispatchLog(`User requested language shift to: ${newLang}`);
            
            // Save preference locally and update global tracker
            localStorage.setItem('tao_locale', newLang);
            window.TAO_LOCALE.active = newLang;
            
            // Fetch the new dictionary
            await this.loadLanguageDictionary(newLang);
            
            // Broadcast event so active UI components (like login.js) know to re-render text
            window.dispatchEvent(new CustomEvent('tao-language-changed', { detail: newLang }));
        };
    },

    async loadLanguageDictionary(langCode) {
        window.TAO_SYSTEM_CONFIG = window.TAO_SYSTEM_CONFIG || {};
        
        try {
            // Fetch the localized JSON file from your config directory
            const response = await fetch(`/config/locales/${langCode}.json`);
            if (!response.ok) throw new Error(`Dictionary not found: ${langCode}.json`);
            
            window.TAO_SYSTEM_CONFIG.LOCALE = await response.json();
            this.dispatchLog(`Successfully loaded '${langCode}' dictionary.`);
            
        } catch (err) {
            this.dispatchLog(`Language '${langCode}' missing. Gracefully falling back to 'en'.`, 'warning');
            
            // Fallback to English if the specific language file isn't created yet
            try {
                const fallbackRes = await fetch(`/config/locales/en.json`);
                window.TAO_SYSTEM_CONFIG.LOCALE = await fallbackRes.json();
                window.TAO_LOCALE.active = 'en';
            } catch (fallbackErr) {
                // Absolute worst-case scenario: No JSON files exist on Day 1
                this.dispatchLog(`CRITICAL: 'en.json' missing. Engaging hardcoded emergency English.`, 'error');
                window.TAO_SYSTEM_CONFIG.LOCALE = {
                    "system_error": "Localization failure.",
                    "login": "Login"
                };
            }
        }
    },

    initVoiceEngine() {
        let isUnlocked = false; 

        const unlock = () => {
            if (isUnlocked) return;
            isUnlocked = true;

            try {
                unlockVoiceEngine();
                this.dispatchLog('Audio firewall silently unlocked.');
            } catch (err) {
                console.error('[Bootstrap] Audio unlock failed:', err);
                this.dispatchLog('Audio firewall unlock failed.', 'warning');
            } finally {
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
            }
        };
        
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        this.dispatchLog('Voice unlock listeners engaged.');
    }
};