// File: /frontend/config/help-dictionary.js

/**
 * ============================================================================
 * MODULE: /frontend/config/help-dictionary.js
 * 
 * FUNCTION: 
 * The localized data store for all OS Help text. Separating this from the 
 * help-engine.js logic allows for easy updates without touching core code.
 * 
 * FUTURE STATE:
 * This static object will eventually be replaced by a fetch() call to the 
 * AWS database, dynamically loading custom objects created in the Forge.
 * ============================================================================
 */

export const HELP_DICTIONARY = {
    'forge': { 
        title: 'The Forge', 
        category: 'System', 
        text: 'The Forge allows you to create new system objects. Fill out the blueprint form, specify visibility, and commit it to the database.' 
    },
    'windowmanager': { 
        title: 'Window Manager', 
        category: 'System', 
        text: 'Drag windows by their top header to move them. Use the dock to sweep them away and reveal your background.' 
    },
    'health': { 
        title: 'Health Galaxy', 
        category: 'Galaxy', 
        text: 'Track your dietary intake, analyze macronutrients, and monitor your physical systems here.' 
    },
    'messaging': { 
        title: 'Communication Hub', 
        category: 'Galaxy', 
        text: 'View your inbox and transmit encrypted messages to other users.' 
    },
    'default': { 
        title: 'Unknown Object', 
        category: 'System', 
        text: 'I am sorry, there is no help set up for this module yet.' 
    }
};