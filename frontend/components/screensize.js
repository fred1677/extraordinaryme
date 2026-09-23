// File: /frontend/components/screensize.js

/**
 * ============================================================================
 * MODULE: /frontend/components/screensize.js
 * 
 * FUNCTION: 
 * The Master Sizing Engine. Calculates true viewports and mathematically 
 * enforces the UI Safe Zone by physically constraining the User Workspace 
 * between the universal Top and Bottom bars.
 * ============================================================================
 */

export function initScreenSize() {
    console.log('[Engine] Initiating Display Scanner...');

    // 1. Deep OS & Platform Detection
    const ua = navigator.userAgent;
    let detectedOS = 'Unknown';
    
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
        detectedOS = 'iOS';
    } else if (/android/i.test(ua)) {
        detectedOS = 'Android';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        detectedOS = 'macOS';
    } else if (/Windows/i.test(ua)) {
        detectedOS = 'Windows';
    } else if (/Linux/i.test(ua)) {
        detectedOS = 'Linux';
    }

    const isMobileDevice = (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) || (window.innerWidth <= 768);
    const platformType = isMobileDevice ? 'Mobile' : 'Desktop';

    // 2. Establish Global Display State
    window.TAO_DISPLAY = {
        os: detectedOS,
        platform: platformType,
        deviceMode: window.TAO_ENV || (isMobileDevice ? 'mobile' : 'desktop'), 
        trueHeight: window.innerHeight,
        trueWidth: document.documentElement.clientWidth,
        canvasWidth: document.documentElement.clientWidth,
        topBarHeight: 45, 
        bottomBarHeight: 45, 
        workspaceHeight: 0,
        isMobile: isMobileDevice
    };

    // 3. The Master Calculator
    const calculateViewport = () => {
        const rawHeight = window.innerHeight;
        const rawWidth = document.documentElement.clientWidth; 
        
        window.TAO_DISPLAY.trueHeight = rawHeight;
        window.TAO_DISPLAY.trueWidth = rawWidth;
        window.TAO_DISPLAY.canvasWidth = rawWidth; 
        window.TAO_DISPLAY.isMobile = rawWidth <= 768;
        window.TAO_DISPLAY.platform = window.TAO_DISPLAY.isMobile ? 'Mobile' : 'Desktop';
        
        const vh = rawHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        const orbSize = window.TAO_USER_CONFIG?.orbSize || window.TAO_SYSTEM_CONFIG?.HARDWARE?.ORB_BASE_SIZE || 44;
        const barHeight = window.TAO_SYSTEM_CONFIG?.HARDWARE?.TOP_BAR_HEIGHT || (orbSize + 0.8);
        
        window.TAO_DISPLAY.topBarHeight = barHeight;
        window.TAO_DISPLAY.bottomBarHeight = barHeight;

        const workspaceH = rawHeight - (barHeight * 2);
        window.TAO_DISPLAY.workspaceHeight = workspaceH;

        const root = document.documentElement;
        root.style.setProperty('--top-bar-height', `${barHeight}px`);
        root.style.setProperty('--bottom-bar-height', `${barHeight}px`);
        root.style.setProperty('--workspace-height', `${workspaceH}px`);
        root.style.setProperty('--app-width', `${rawWidth}px`);
        root.style.setProperty('--app-height', `${rawHeight}px`);

        // 4. Physically bind OS layers to edge-to-edge hardware boundaries
        const layersToConstrain = [
            'layer-2-user', 'layer-3-application', 
            'layer-5-header', 'layer-6-lockscreen'
        ];
        
        layersToConstrain.forEach(layerId => {
            const layer = document.getElementById(layerId);
            if (layer) {
                layer.style.position = 'absolute'; 
                layer.style.left = '0px';
                layer.style.right = '0px';
                layer.style.margin = '0';
                layer.style.width = `${rawWidth}px`; 
                
                if (layerId === 'layer-2-user' || layerId === 'layer-3-application') {
                    layer.style.top = `${barHeight}px`; 
                    layer.style.height = `${workspaceH}px`; 
                    layer.style.overflow = 'hidden';
                }
            }
        });
        
        const logMsg = `Hardware Geometry Mapped: ${rawWidth}px x ${rawHeight}px (OS: ${detectedOS} | Platform: ${platformType})`;
        console.log(`[Engine] ${logMsg}`);

        window.dispatchEvent(new CustomEvent('TAO_DISPLAY_RESIZED', { detail: window.TAO_DISPLAY }));
    };

    calculateViewport();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            requestAnimationFrame(calculateViewport);
        }, 150); 
    });
}