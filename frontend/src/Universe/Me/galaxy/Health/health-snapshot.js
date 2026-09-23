/**
 * ============================================================================
 * MODULE: health-snapshot.js
 * 
 * DESCRIPTION:
 * Module-specific Snapshot overlay for the Health application.
 * Triggered via the 'tao-snapshot-clicked' OS Signal from the Window Manager.
 * Generates a camera flash effect and a localized glass-morphism popup 
 * inside the Health window.
 * ============================================================================
 */

export function executeSnapshot(parentWindow) {
    if (!parentWindow) return;

    // Prevent duplicate overlays if the user clicks rapidly
    if (parentWindow.querySelector('.tao-health-snapshot-overlay')) return;

    // --- 1. The Camera Flash Effect ---
    const flash = document.createElement('div');
    Object.assign(flash.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: '#ffffff', zIndex: '100000', pointerEvents: 'none',
        opacity: '1', transition: 'opacity 0.4s ease-out',
        borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px'
    });
    parentWindow.appendChild(flash);
    
    // Fade out and remove the flash instantly
    setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 400);
    }, 50);

    // --- 2. The Dark Glass Overlay ---
    const overlay = document.createElement('div');
    overlay.classList.add('tao-health-snapshot-overlay');
    Object.assign(overlay.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99999', 
        borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px'
    });

    // --- 3. The Modal Box ---
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center',
        border: '1px solid #e2e8f0', maxWidth: '300px', pointerEvents: 'auto'
    });

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
    Object.assign(icon.style, { marginBottom: '12px' });

    const title = document.createElement('h3');
    title.innerText = "Snapshot Captured";
    Object.assign(title.style, { color: '#0f172a', margin: '0 0 12px 0', fontFamily: 'sans-serif', fontSize: '18px' });

    const message = document.createElement('p');
    message.innerText = "The logic to capture, save, and export the current data state of the Health Module will be developed here.";
    Object.assign(message.style, { color: '#64748b', fontSize: '14px', margin: '0 0 24px 0', fontFamily: 'sans-serif', lineHeight: '1.5' });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "Acknowledge";
    Object.assign(closeBtn.style, {
        backgroundColor: '#10b981', color: '#ffffff', border: 'none',
        padding: '10px 16px', borderRadius: '6px', cursor: 'pointer',
        fontWeight: 'bold', fontSize: '13px', width: '100%', transition: 'background-color 0.2s'
    });
    
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#059669'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#10b981'; };
    
    closeBtn.onclick = () => {
        overlay.style.transition = 'opacity 0.2s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);

    // Fade in the modal slightly delayed behind the flash
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease 0.1s';
    parentWindow.appendChild(overlay);
    
    setTimeout(() => overlay.style.opacity = '1', 10);
}