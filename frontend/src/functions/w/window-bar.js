// File: /frontend/src/functions/w/window-bar.js

/**
 * ============================================================================
 * MODULE: /frontend/src/functions/w/window-bar.js
 * 
 * FUNCTION: 
 * Generates the standardized Mac-style window header (Traffic lights, Title).
 * 
 * ARCHITECTURE DETAILS:
 * - Delegation: This file handles clicks for Close, Minimize, and Maximize.
 *   It strictly DELEGATES dragging to the centralized windowmanager.js to 
 *   prevent coordinate jumping and event listener conflicts.
 * - Maximize Math: Uses 100% width/height to perfectly fill the parent 
 *   Safe Zone container, never calculating absolute pixels.
 * - Title Formatting: Automatically strips '.js' extensions to display clean 
 *   module names (e.g., 'Me.js' becomes 'Me').
 * ============================================================================
 */

export function createWindowBar({ titleText, windowElement, onClose, onDock }) {
    const bar = document.createElement('div');
    bar.classList.add('window-header'); // Explicit tag for windowmanager.js to lock onto
    Object.assign(bar.style, {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155',
        borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
        cursor: 'grab', userSelect: 'none', position: 'relative', flexShrink: 0
    });

    // ==========================================
    // LEFT: THE TRAFFIC LIGHTS
    // ==========================================
    const lights = document.createElement('div');
    Object.assign(lights.style, { display: 'flex', gap: '8px', alignItems: 'center', zIndex: 2 });

    const createLight = (color) => {
        // Changed from 'div' to 'button' so the Drag Engine ignores them
        const dot = document.createElement('button');
        Object.assign(dot.style, { 
            width: '13px', height: '13px', borderRadius: '50%', 
            backgroundColor: color, cursor: 'pointer',
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.3)',
            border: 'none', padding: '0', outline: 'none' // Reset button styles
        });
        return dot;
    };

    const redBtn = createLight('#ff5f56');    // Close
    const yellowBtn = createLight('#ffbd2e'); // Dock/Minimize
    const greenBtn = createLight('#27c93f');  // Maximize/Restore

    redBtn.onclick = (e) => { 
        e.stopPropagation(); 
        if (onClose) onClose(); 
        else windowElement.remove(); 
    };

    yellowBtn.onclick = (e) => { 
        e.stopPropagation(); 
        if (onDock) onDock(); 
        else {
            console.log('[Window Manager] Sent to Dock (Hidden)');
            windowElement.style.display = 'none';
        }
    };

    let isMaximized = false;
    let preMaxState = { top: '', left: '', width: '', height: '', transform: '' };

    greenBtn.onclick = (e) => {
        e.stopPropagation();
        
        // No manual pixel math. Trust the parent container!
        if (!isMaximized) {
            // Add a class to lock the window from being dragged
            windowElement.classList.add('is-maximized');
            
            preMaxState = {
                top: windowElement.style.top, left: windowElement.style.left,
                width: windowElement.style.width, height: windowElement.style.height,
                transform: windowElement.style.transform
            };
            Object.assign(windowElement.style, {
                top: '0px', left: '0px', width: '100%', height: '100%', 
                transform: 'none', borderRadius: '0'
            });
            bar.style.borderTopLeftRadius = '0';
            bar.style.borderTopRightRadius = '0';
            resizer.style.display = 'none'; 
            isMaximized = true;
        } else {
            // Unlock the window
            windowElement.classList.remove('is-maximized');
            
            Object.assign(windowElement.style, {
                top: preMaxState.top || '2%', left: preMaxState.left || '5%',
                width: preMaxState.width || '90%', height: preMaxState.height || '70%', 
                transform: preMaxState.transform, borderRadius: '8px'
            });
            bar.style.borderTopLeftRadius = '8px';
            bar.style.borderTopRightRadius = '8px';
            resizer.style.display = 'block'; 
            isMaximized = false;
        }
    };

    lights.appendChild(redBtn);
    lights.appendChild(yellowBtn);
    lights.appendChild(greenBtn);

    // ==========================================
    // CENTER: THE TITLE (Clean Module Name)
    // ==========================================
    // Automatically strip '.js' from the provided title text
    const cleanTitle = titleText ? titleText.replace(/\.js$/i, '') : 'Window';

    const title = document.createElement('div');
    title.innerText = cleanTitle;
    Object.assign(title.style, {
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        color: '#94a3b8', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.9rem',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '50%', zIndex: 1
    });

    // ==========================================
    // RIGHT: REDUNDANT 'X' CLOSE BUTTON
    // ==========================================
    const rightClose = document.createElement('button');
    rightClose.innerText = 'X';
    Object.assign(rightClose.style, {
        background: 'transparent', color: '#64748b', border: 'none',
        cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', padding: '0 4px', zIndex: 2
    });
    rightClose.onmouseover = () => rightClose.style.color = '#ef4444';
    rightClose.onmouseout = () => rightClose.style.color = '#64748b';
    rightClose.onclick = (e) => { 
        e.stopPropagation(); 
        if (onClose) onClose(); 
        else windowElement.remove(); 
    };

    bar.appendChild(lights);
    bar.appendChild(title);
    bar.appendChild(rightClose);

    // ==========================================
    // CUSTOM PHYSICAL RESIZE HANDLE (Mobile Safe)
    // ==========================================
    // Resizing uses width/height deltas, so it doesn't conflict with coordinate math
    const resizer = document.createElement('div');
    Object.assign(resizer.style, {
        position: 'absolute', bottom: '0', right: '0', 
        width: '26px', height: '26px', cursor: 'nwse-resize', zIndex: 10000,
        background: 'linear-gradient(135deg, transparent 50%, rgba(56, 189, 248, 0.5) 50%)',
        borderBottomRightRadius: '8px'
    });
    windowElement.appendChild(resizer);

    let isResizing = false;
    let rStartW, rStartH, rStartX, rStartY;

    const startResize = (clientX, clientY) => {
        if (isMaximized) return;
        isResizing = true;
        const rect = windowElement.getBoundingClientRect();
        rStartW = rect.width;
        rStartH = rect.height;
        rStartX = clientX;
        rStartY = clientY;
    };

    const doResize = (clientX, clientY) => {
        if (!isResizing) return;
        const newW = rStartW + (clientX - rStartX);
        const newH = rStartH + (clientY - rStartY);
        windowElement.style.width = `${Math.max(280, newW)}px`;
        windowElement.style.height = `${Math.max(200, newH)}px`;
    };

    const endResize = () => { isResizing = false; };

    resizer.addEventListener('mousedown', (e) => {
        e.stopPropagation(); e.preventDefault();
        startResize(e.clientX, e.clientY);
        const onMove = (ev) => doResize(ev.clientX, ev.clientY);
        const onUp = () => { endResize(); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });

    resizer.addEventListener('touchstart', (e) => {
        e.stopPropagation(); 
        const touch = e.touches[0];
        startResize(touch.clientX, touch.clientY);
        const onMove = (ev) => { ev.preventDefault(); doResize(ev.touches[0].clientX, ev.touches[0].clientY); };
        const onUp = () => { endResize(); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    }, { passive: false });

    return bar;
}