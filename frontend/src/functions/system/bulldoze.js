// File: /frontend/engines/bulldoze.js

/**
 * ============================================================================
 * MODULE: /frontend/engines/bulldoze.js
 * 
 * FUNCTION: 
 * The Universal Demolition Engine. Safely wipes specific DOM elements, 
 * empties physical Z-index layers, or surgically removes specific module 
 * windows based on their mathematical slot bucket to prevent "ghost" apps.
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE (SSOT Dynamic Math):
 * - Ignorant Module: This engine no longer hardcodes its mathematical hunting grounds.
 * - Configuration Driven: Dynamically pulls its boundaries (Z_BASE and SLOT_SIZE) 
 *   directly from window.TAO_USER_CONFIG.
 * - Unified Export: Natively exports the `bulldoze` function for direct imports 
 *   by system modules like get-highest-user-layer.js.
 * ============================================================================
 */

export function bulldoze(targets, userId = 'System') {
    // Dynamically load Single Source of Truth (with safe fallbacks)
    const conf = window.TAO_USER_CONFIG || { Z_BASE: 20000, SLOT_SIZE: 100 };

    // =========================================================
    // PROTOCOL 1: Mathematical Slot Purge (e.g., [2.01])
    // Used by get-highest-user-layer.js to clear ghosts before a new launch.
    // =========================================================
    if (Array.isArray(targets) && typeof targets[0] === 'number') {
        const osWindows = document.querySelectorAll('.tao-window, .tao-workspace-window, [id^="float-win-"], [id^="editor-win-"], #tao-manageobject-panel');
        let wipedCount = 0;

        targets.forEach(slotConceptual => {
            // Translate 2.01 into Slot 1
            const slotStr = slotConceptual.toFixed(2); 
            const slotNum = parseInt(slotStr.split('.')[1], 10); 
            
            // Calculate the dynamic bucket boundaries from SSOT
            const minZ = conf.Z_BASE + (slotNum * conf.SLOT_SIZE);
            const maxZ = minZ + (conf.SLOT_SIZE - 1);

            osWindows.forEach(win => {
                const z = parseInt(window.getComputedStyle(win).zIndex, 10);
                if (!isNaN(z) && (z >= minZ && z <= maxZ)) {
                    win.remove();
                    wipedCount++;
                }
            });
        });

        if (wipedCount > 0) {
            console.log(`[Demolition] Purged ${wipedCount} ghost windows from mathematical slots.`);
        }
        return document.getElementById('app-root');
    }

    // =========================================================
    // PROTOCOL 2: Standard Object/Layer Demolition
    // Used by window.TAO_ENGINE for general OS clean-up.
    // =========================================================
    const config = targets || {};
    const layerTargets = Array.isArray(config.layers) ? config.layers : (config.layers ? [config.layers] : []);
    const objectTargets = Array.isArray(config.objects) ? config.objects : (config.objects ? [config.objects] : []);

    // 1. Wipe specific physical layers (Empty children, keep the layer)
    layerTargets.forEach(layerId => {
        const layer = document.getElementById(layerId);
        if (layer) {
            layer.innerHTML = ''; 
            console.log(`[Demolition] Layer wiped: ${layerId}`);
        }
    });

    // 2. Surgically extract specific DOM objects
    objectTargets.forEach(objId => {
        const obj = document.getElementById(objId);
        if (obj) {
            obj.remove();
            console.log(`[Demolition] Object removed: ${objId}`);
        }
    });

    // Return the overarching clean-slate canvas
    return document.getElementById('app-root');
}

export function initBulldoze() {
    window.TAO_ENGINE = window.TAO_ENGINE || {};
    
    // Attach the master function
    window.TAO_ENGINE.bulldoze = bulldoze;

    // =========================================================
    // Legacy Wrappers 
    // =========================================================
    window.TAO_ENGINE.wipeDimension = (layerInput) => {
        return bulldoze({ layers: layerInput });
    };

    window.TAO_ENGINE.destroyObject = (objectInput) => {
        return bulldoze({ objects: objectInput });
    };
    
    console.log('[Boot] Demolition Engine mounted and unified with SSOT.');
}