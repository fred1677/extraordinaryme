// File: /frontend/engines/define-layers.js

/**
 * ============================================================================
 * MODULE: /frontend/engines/define-layers.js
 * 
 * FUNCTION: 
 * Global Configuration Injector. 
 * Note: Physical DOM layering has been deprecated in favor of a Flat-DOM 
 * architecture managed dynamically by windowmanager.js to prevent CSS 
 * stacking context traps.
 * ============================================================================
 */

import { SYSTEM_CONFIG } from '../config/system-config.js';
import { USER_CONFIG } from '../config/user-config.js';

export function buildSystemLayers(container) {
    console.log('[Architecture] Initializing Flat-DOM Canvas and Injecting Global Configs...');
    
    if (container) {
        container.innerHTML = '';
        Object.assign(container.style, {
            position: 'relative', 
            width: '100vw', 
            height: '100dvh', 
            overflow: 'hidden',
            backgroundColor: '#000' 
        });
    }

    // 1. Inject configs globally for the OS to read
    window.TAO_SYSTEM_CONFIG = SYSTEM_CONFIG;
    window.TAO_USER_CONFIG = USER_CONFIG;

    // 2. Fallback Bridge for Legacy Modules
    // Any module attempting to mount to a specific "Layer" will be safely 
    // redirected to the root canvas, allowing windowmanager.js to handle the Z-Index.
    window.TAO_ENGINE = window.TAO_ENGINE || {};
    window.TAO_ENGINE.LAYERS = {
        SPACE: 'tao-os-root',
        USER: 'tao-os-root',
        CHATBOX: 'tao-os-root',
        DRAWER: 'tao-os-root',
        HEADER: 'tao-os-root',
        LOCKSCREEN: 'tao-os-root'
    };
    
    // Inject the CSS baseline for backward compatibility if needed
    document.documentElement.style.setProperty(`--tao-z-base`, USER_CONFIG.Z_BASE || '20000');
}