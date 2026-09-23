// File: /frontend/src/system/desktop.js

/**
 * ============================================================================
 * MODULE: /frontend/src/system/desktop.js
 * 
 * FUNCTION: 
 * Paints the Option B Home Screen. This establishes the immutable 
 * OS floor. It is permanently rendered in layer-2-user and naturally 
 * revealed when active windows are swept into the bottom Dock.
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE (SSOT Dynamic Math):
 * - Ignorant Module: Removed the hardcoded '2000' Z-index.
 * - Configuration Driven: Now dynamically anchors to window.TAO_USER_CONFIG.Z_BASE 
 *   so it always sits perfectly underneath Slot 1 (20100), regardless of scaling.
 * ============================================================================
 */

export function initDesktop() {
    console.log('[Desktop] Booting Home Screen Environment...');

    // Load config dynamically for SSOT adherence
    const conf = window.TAO_USER_CONFIG || { Z_BASE: 20000 };

    const layer2 = document.getElementById('layer-2-user');
    if (!layer2) {
        console.error('[Desktop] FATAL: layer-2-user is missing. Cannot paint desktop.');
        return;
    }

    // 1. Create the physical desktop canvas
    const desktopFloor = document.createElement('div');
    desktopFloor.id = 'tao-os-desktop';
    
    Object.assign(desktopFloor.style, {
        position: 'absolute',
        inset: '0', // Stretches to completely fill layer-2-user
        width: '100%',
        height: '100%',
        zIndex: conf.Z_BASE, // >>> THE SSOT FIX: Locks dynamically to the mathematical floor
        backgroundColor: '#0f172a', // macOS-style dark slate background fallback
        backgroundImage: 'url("/assets/wallpaper.jpg")', // Placeholder for a real background
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'auto' // CRITICAL: Allows clicks on desktop icons
    });

    // 2. Add a clean OS System Clock (Classic Desktop aesthetic)
    const clockWidget = document.createElement('div');
    Object.assign(clockWidget.style, {
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '5rem',
        fontWeight: '200',
        userSelect: 'none',
        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
    });
    
    const updateClock = () => {
        const now = new Date();
        clockWidget.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateClock, 1000);
    updateClock();

    desktopFloor.appendChild(clockWidget);

    // 3. Lock it into the physical DOM
    layer2.appendChild(desktopFloor);
    console.log(`[Desktop] Home Screen successfully locked at Z-index ${conf.Z_BASE}.`);

    // 4. Broadcast to OS Telemetry
    window.dispatchEvent(new CustomEvent('TAO_LIVE_LOG', { 
        detail: { 
            moduleName: 'desktop.js', 
            message: `Home Screen successfully painted at Option B Floor (Z: ${conf.Z_BASE}).`, 
            type: 'info', 
            timestamp: new Date().toLocaleString() 
        } 
    }));
}