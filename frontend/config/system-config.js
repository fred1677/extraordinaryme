// File: /frontend/config/system-config.js

/**
 * ============================================================================
 * MODULE: /frontend/config/system-config.js
 * 
 * FUNCTION: 
 * The Single Source of Truth (SSOT) for the TAO OS Shell. Defines the physical 
 * UI layers, hardware boundaries, global physics rules, and base UI scaling. 
 * ============================================================================
 * 
 * ARCHITECTURE DETAILS:
 * - Centralized Control: All system-level modules (e.g., define-layers.js) read 
 *   from this file. Changing a Z-index here mathematically cascades through 
 *   the entire Operating System without needing to update individual files.
 * - Non-User Layers: This config strictly governs the system boundaries 
 *   (Layers 1, 3, 4, 5, and 6).
 * - Hardware Scaling: ORB_BASE_SIZE dictates the physical size of top bar 
 *   buttons, drawer list items, and chatbox safe zones globally.
 * ============================================================================
 */

export const SYSTEM_CONFIG = {
    // Defines the OS-level UI and hardware layers
    LAYERS: {
        SPACE:      { id: 'layer-1-space',      zIndex: 10000 },
        CHATBOX:    { id: 'layer-3-chatbox',    zIndex: 30000 },
        DRAWER:     { id: 'layer-4-drawer',     zIndex: 40000 },
        HEADER:     { id: 'layer-5-header',     zIndex: 50000 },
        LOCKSCREEN: { id: 'layer-6-lockscreen', zIndex: 60000 } // NEW: Absolute OS Lockdown
    },

    // Centralized Hardware UI Sizing (The Ultimate Source of Truth)
    HARDWARE: {
        ORB_BASE_SIZE: 44, // Base scale for all UI hardware buttons and math calculations
        get TOP_BAR_HEIGHT() { return this.ORB_BASE_SIZE + 0.8; }
    },
    
    // Global OS physics constraints
    PHYSICS: {
        MAX_SAFE_TOP_OFFSET: 100 // Prevent dragging windows above the top UI bar
    }
};