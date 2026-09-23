// File: /frontend/components/select-language.js

/**
 * ============================================================================
 * MODULE: /frontend/components/select-language.js
 * 
 * FUNCTION: 
 * The Out-Of-Box Experience (OOBE). Executes only on the very first boot of 
 * the OS to establish the global hardware language before user accounts exist.
 * ============================================================================
 */

export function renderLanguageSetup(targetElement, onSuccess) {
    const lockZIndex = window.TAO_SYSTEM_CONFIG?.LAYERS?.LOCKSCREEN?.zIndex || 60000;

    Object.assign(targetElement.style, {
        margin: '0',
        height: '100dvh',
        backgroundColor: '#0f172a', // Darker installer background
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        zIndex: lockZIndex, 
        position: 'relative'
    });

    targetElement.innerHTML = `
        <div style="background: #1e293b; padding: 40px; border-radius: 12px; text-align: center; border: 1px solid #334155; box-shadow: 0 20px 40px rgba(0,0,0,0.6); width: 90%; max-width: 400px;">
            <h2 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 24px;">Welcome to TAO</h2>
            <p style="color: #94a3b8; margin: 0 0 30px 0; font-size: 14px;">Select your system language to begin setup.</p>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button class="tao-lang-btn" data-lang="en" style="padding: 16px; background: #38bdf8; color: #0f172a; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s;">English (US)</button>
                <button class="tao-lang-btn" data-lang="es" style="padding: 16px; background: #334155; color: #f8fafc; border: 1px solid #475569; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s;">Español</button>
                <button class="tao-lang-btn" data-lang="zh" style="padding: 16px; background: #334155; color: #f8fafc; border: 1px solid #475569; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s;">中文 (Chinese)</button>
                <button class="tao-lang-btn" data-lang="fr" style="padding: 16px; background: #334155; color: #f8fafc; border: 1px solid #475569; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.2s;">Français</button>
            </div>
        </div>
    `;

    // Handle Hover States for inactive buttons
    const buttons = targetElement.querySelectorAll('.tao-lang-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
            if (e.target.style.background !== 'rgb(56, 189, 248)' && e.target.style.background !== '#38bdf8') {
                e.target.style.background = '#475569';
            }
        });
        btn.addEventListener('mouseleave', (e) => {
            if (e.target.style.background !== 'rgb(56, 189, 248)' && e.target.style.background !== '#38bdf8') {
                e.target.style.background = '#334155';
            }
        });

        btn.addEventListener('click', (e) => {
            const selectedLang = e.target.getAttribute('data-lang');
            
            // 1. Save global OS language
            localStorage.setItem('tao_sys_language', selectedLang);
            
            // 2. Set OS locale logic if engine exists
            window.TAO_LOCALE = window.TAO_LOCALE || { installed: [] };
            window.TAO_LOCALE.active = selectedLang;
            
            // 3. Clean up and proceed
            targetElement.innerHTML = '';
            if (onSuccess) onSuccess(selectedLang);
        });
    });
}