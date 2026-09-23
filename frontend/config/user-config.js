// File: /frontend/config/user-config.js

/**
 * ============================================================================
 * MODULE: /frontend/config/user-config.js
 * 
 * FUNCTION: 
 * The Single Source of Truth (SSOT) for the TAO User Workspace. Defines the 
 * physical DOM container, mathematical Z-index boundaries, and the bucket logic 
 * for application window slotting.
 * ============================================================================
 */

export const USER_CONFIG = {
    // The physical DOM container
    WORKSPACE_LAYER_ID: 'layer-2-user',
    
    // The mathematical boundaries of the workspace
    Z_BASE: 20000,
    Z_MAX: 29999,
    
    // The Z-index where the active window is forced to float
    FRONT_STAGE_BASE: 29900,
    
    // OS-Level App Exceptions (Absolute Top of Layer 2)
    WORKSPACE_TOP: 29990, // Capped top of the workspace, leaving 29991+ available for emergencies
    
    // Window Management Math
    SLOTS_MAX: 98,       // Slots 1-98 for background applications
    SLOT_SIZE: 100       // Max 99 popups/sub-windows per app (e.g., 20100 to 20199)
};