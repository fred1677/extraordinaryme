// File: /frontend/engines/bulldoze.js

export function initBulldoze() {
    window.TAO_ENGINE = window.TAO_ENGINE || {};
    
    /**
     * Universal Silent Demolition Tool
     * Dynamically references TAO configs to ensure structural integrity.
     */
    window.TAO_ENGINE.bulldoze = ({ layers = [], objects = [] } = {}) => {
        let layerTargets = Array.isArray(layers) ? layers : [layers];
        const objectTargets = Array.isArray(objects) ? objects : [objects];

        // >>> DYNAMIC ARCHITECTURE TRIGGER
        // If commanded to wipe 'ALL', read the configs dynamically to get EVERY layer ID
        if (layers === 'ALL') {
            const sysLayers = window.TAO_SYSTEM_CONFIG ? Object.values(window.TAO_SYSTEM_CONFIG.LAYERS).map(l => l.id) : [];
            const usrLayer = window.TAO_USER_CONFIG ? window.TAO_USER_CONFIG.WORKSPACE_LAYER_ID : null;
            layerTargets = [...sysLayers, usrLayer].filter(Boolean);
        }

        // Wipe specified layers silently
        layerTargets.forEach(layerId => {
            const layer = document.getElementById(layerId);
            
            if (layer) {
                // 1. Vaporize the HTML contents
                layer.innerHTML = ''; 
                
                // 2. CRITICAL: Reset the physical barrier. 
                // Prevents a ghost Layer 6 (Login) from permanently blocking OS clicks.
                layer.style.pointerEvents = 'none'; 
            }
        });

        // Surgically extract specific objects
        objectTargets.forEach(objId => {
            const obj = document.getElementById(objId);
            if (obj) obj.remove();
        });

        return document.getElementById('app-root') || document.body;
    };

    // Legacy Wrappers
    window.TAO_ENGINE.wipeDimension = (layerInput) => {
        return window.TAO_ENGINE.bulldoze({ layers: layerInput });
    };

    window.TAO_ENGINE.destroyObject = (objectInput) => {
        return window.TAO_ENGINE.bulldoze({ objects: objectInput });
    };
}