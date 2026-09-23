// File: /frontend/config/tao-dictionary.js

/**
 * ============================================================================
 * MODULE: /frontend/config/tao-dictionary.js
 * 
 * FUNCTION: 
 * The Master Execution Registry for the TAO OS. Maps spoken/typed object names 
 * to their physical system files and defines their execution behavior.
 * 
 * BEHAVIOR LOGIC (Handled by taoengine.js later):
 * - Implicit Mention (e.g., "What about health?"): TAO replies, "I found 
 *   this object, do you want me to run it?"
 * - Explicit Command (e.g., "Run health", "Go to my-new-universe"): TAO 
 *   bypasses the prompt and directly executes the associated module.
 * 
 * FUTURE STATE:
 * Like the Help Dictionary, this will eventually be dynamically generated 
 * via a database fetch() based on what the user has forged in create.js.
 * ============================================================================
 */

export const TAO_DICTIONARY = {
    // === UNIVERSES (Triggers Warp Sequence) ===
    'my-new-universe': {
        type: 'universe',
        handler: 'create-new-universe.js',
        description: 'A custom universe instance.'
    },
    
    // === GALAXIES (Application Modules) ===
    'health': {
        type: 'galaxy',
        handler: 'health.html', // Or health.js depending on your final routing
        description: 'Dietary and physical tracking module.'
    },
    'messaging': {
        type: 'galaxy',
        handler: 'messaging.html',
        description: 'Encrypted communication hub.'
    },

    // === SYSTEM OBJECTS (Foundational Tools) ===
    'forge': {
        type: 'system-program',
        handler: 'create.js',
        description: 'The object creation assembly line.'
    }
};