// File: /frontend/bootstrap.js

/**
 * ============================================================================
 * MODULE: /frontend/bootstrap.js
 * 
 * FUNCTION: 
 * The Pre-Flight Hardware Sensor. Detects hardware environment, bypasses 
 * audio firewalls, detects user localization, and initializes the Window Manager.
 * ============================================================================
 */

import { unlockVoiceEngine } from './components/voiceManager.js';
import { initWindowManager } from './components/windowmanager.js';

export const AppBootstrap = {
    async init() {
        console.log(`[Bootstrap] Initializing TAO Engine...`);
        
        try {
            const rawWidth = window.innerWidth;
            const rawHeight = window.innerHeight;
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) || rawWidth <= 768;
            const detectedEnv = isMobileDevice ? 'mobile' : 'desktop';
            
            // 🚀 NEW: Standalone (PWA) vs Browser Detection
            const isStandaloneApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
            
            console.log(`[Bootstrap] Environment trapped: ${detectedEnv} | Installed App: ${isStandaloneApp}`);
            
            // Set Global Flags (This is the Single Source of Truth for Window Manager)
            window.TAO_ENV = detectedEnv; 
            window.TAO_IS_APP = isStandaloneApp; 

            // Dispatch hardware state in the background (Non-blocking)
            this.dispatchLog(`Hardware Footprint Trapped: ${rawWidth}px x ${rawHeight}px (${detectedEnv}) [App Mode: ${isStandaloneApp}]`);

            // 1. Initialize Core Engines
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

    async dispatchLog(message, logType = 'info') {
        const payload = { moduleName: 'bootstrap.js', message: message, type: logType, timestamp: new Date().toLocaleString() };
        window.dispatchEvent(new CustomEvent('TAO_LIVE_LOG', { detail: payload }));

        try {
            await fetch('/api/system/log', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module_name: payload.moduleName, message: payload.message, log_type: payload.type })
            });
        } catch (err) {}
    },

    async initLanguageEngine() {
        const installedLanguages = [
            { code: 'en', name: 'English' }, { code: 'es', name: 'Español' },
            { code: 'zh', name: '中文' }, { code: 'fr', name: 'Français' }, { code: 'ja', name: '日本語' }
        ];

        const savedLang = localStorage.getItem('tao_locale');
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
        const activeLang = savedLang || browserLang;

        window.TAO_LOCALE = { browserDefault: browserLang, installed: installedLanguages, active: activeLang };

        this.dispatchLog(`Language engine engaged. Target Locale: ${activeLang}`);
        await this.loadLanguageDictionary(activeLang);

        window.TAO_CHANGE_LANGUAGE = async (newLang) => {
            if (newLang === window.TAO_LOCALE.active) return;
            this.dispatchLog(`User requested language shift to: ${newLang}`);
            localStorage.setItem('tao_locale', newLang);
            window.TAO_LOCALE.active = newLang;
            await this.loadLanguageDictionary(newLang);
            window.dispatchEvent(new CustomEvent('tao-language-changed', { detail: newLang }));
        };
    },

    async loadLanguageDictionary(langCode) {
        window.TAO_SYSTEM_CONFIG = window.TAO_SYSTEM_CONFIG || {};
        try {
            const response = await fetch(`/config/locales/${langCode}.json`);
            if (!response.ok) throw new Error(`Dictionary not found: ${langCode}.json`);
            window.TAO_SYSTEM_CONFIG.LOCALE = await response.json();
            this.dispatchLog(`Successfully loaded '${langCode}' dictionary.`);
        } catch (err) {
            this.dispatchLog(`Language '${langCode}' missing. Gracefully falling back to 'en'.`, 'warning');
            try {
                const fallbackRes = await fetch(`/config/locales/en.json`);
                window.TAO_SYSTEM_CONFIG.LOCALE = await fallbackRes.json();
                window.TAO_LOCALE.active = 'en';
            } catch (fallbackErr) {
                this.dispatchLog(`CRITICAL: 'en.json' missing. Engaging emergency English.`, 'error');
                window.TAO_SYSTEM_CONFIG.LOCALE = { "system_error": "Localization failure.", "login": "Login" };
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