// File: /frontend/src/config/display-config.js

/**
 * ============================================================================
 * MODULE: display-config.js
 * 
 * FUNCTION: 
 * The Single Source of Truth for physical dimensions, safe zones, 
 * and UI scaling. Enforces Apple HIG standard touch targets (44px) 
 * and calculates the exact dimensions of the Layer 2 workspace.
 * ============================================================================
 */

export const DisplayConfig = {
    // 1. Hardcoded Physical Boundaries (Apple HIG Standard)
    barHeight: 44,        // 44px standard for both Top and Bottom bars
    desktopMaxWidth: 430, // The mobile simulator width constraint

    // 2. Dynamic Metric Generator
    calculate(rawWidth, rawHeight, isMobile) {
        const effectiveWidth = isMobile ? rawWidth : Math.min(rawWidth, this.desktopMaxWidth);
        const orbBase = Math.max(32, Math.min(48, effectiveWidth * 0.11));

        // The absolute height of the usable Layer 2 workspace
        const userScreenHeight = rawHeight - (this.barHeight * 2);

        return {
            screen: {
                width: effectiveWidth,
                height: rawHeight
            },
            safeZone: {
                top: this.barHeight,
                bottom: rawHeight - this.barHeight, 
                userScreenHeight: userScreenHeight // Total Height - Top & Bottom Bars
            },
            ui: {
                orbSize: orbBase,
                taoSize: orbBase * 1.25,
                iconSize: orbBase * 0.55,
                padding: Math.max(10, effectiveWidth * 0.04),
                gap: Math.max(6, effectiveWidth * 0.025)
            }
        };
    }
};