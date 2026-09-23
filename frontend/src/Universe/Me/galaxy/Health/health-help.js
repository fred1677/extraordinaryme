/**
 * ============================================================================
 * MODULE: health-help.js
 * 
 * DESCRIPTION:
 * Module-specific Help overlay for the Health application.
 * Triggered via the 'tao-help-clicked' OS Signal from the Window Manager.
 * Generates a localized, glass-morphism popup inside the Health window.
 * ============================================================================
 */

export function executeHelp(parentWindow) {
    if (!parentWindow) return;

    // Prevent duplicate overlays if the user clicks Help multiple times rapidly
    if (parentWindow.querySelector('.tao-health-help-overlay')) return;

    // Create the dark glass overlay
    const overlay = document.createElement('div');
    overlay.classList.add('tao-health-help-overlay');
    Object.assign(overlay.style, {
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99999', // Ensures it covers the entire app canvas and tabs
        borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px'
    });

    // Create the white modal box
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center',
        border: '1px solid #e2e8f0', maxWidth: '300px', pointerEvents: 'auto'
    });

    // Custom Health Icon/Header
    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    Object.assign(icon.style, { marginBottom: '12px' });

    const title = document.createElement('h3');
    title.innerText = "Health Module Help";
    Object.assign(title.style, { color: '#0f172a', margin: '0 0 12px 0', fontFamily: 'sans-serif', fontSize: '18px' });

    const message = document.createElement('p');
    message.innerText = "The specific documentation, shorthand commands, and tutorials for the Health Module are currently under development.";
    Object.assign(message.style, { color: '#64748b', fontSize: '14px', margin: '0 0 24px 0', fontFamily: 'sans-serif', lineHeight: '1.5' });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "Close Help";
    Object.assign(closeBtn.style, {
        backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none',
        padding: '10px 16px', borderRadius: '6px', cursor: 'pointer',
        fontWeight: 'bold', fontSize: '13px', width: '100%', transition: 'background-color 0.2s'
    });
    
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#0284c7'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#0ea5e9'; };
    
    // Smooth fade out and removal
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

    // Fade in animation
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    parentWindow.appendChild(overlay);
    
    // Trigger fade in
    setTimeout(() => overlay.style.opacity = '1', 10);
}