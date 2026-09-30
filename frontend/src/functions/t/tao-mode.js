/**
 * ============================================================================
 * MODULE: /frontend/src/functions/t/tao-mode.js
 * 
 * DESCRIPTION: The Transition Tunnel.
 * Evaluates backend access requests, suspends the public desktop, and 
 * summons the Level-2 Security Gateway (tao-login.js).
 * ============================================================================
 */

export async function triggerTaoMode() {
    console.log('[System Router] Backend transition requested. Verifying clearance...');
    
    const activeUserId = localStorage.getItem('TAO_SESSION_TOKEN');
    if (!activeUserId) {
        console.error('[Security Gateway] No active session found.');
        return { success: false, message: 'No active session.' };
    }

    try {
        // 1. Live Zero-Trust Verification
        const response = await fetch('/api/auth/check-clearance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: activeUserId })
        });
        
        const data = await response.json();

        if (!data.is_taouser) {
            console.warn('[Security Gateway] Access Denied. User lacks Taouser clearance.');
            return { success: false, message: 'Clearance level insufficient for backend access.' }; 
        }
        
        console.log('[Security Gateway] Clearance Verified. Initiating transition sequence.');

        // 2. Suspend Public Actions (Hide the Chatbox so the login prompt is clear)
        const chatboxUi = document.getElementById('tao-chat-ui');
        if (chatboxUi && chatboxUi.style.display !== 'none') {
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
        }

        // 3. Summon the Vault Door
        // Loads tao-login.js which generates the UI overlay to verify the Level-2 password
        const { initTaoLogin } = await import('../../../components/tao-login.js?v=' + new Date().getTime());
        
        // initTaoLogin() waits for the user to either abort or successfully authenticate
        const isAuthenticated = await initTaoLogin();
        
        if (!isAuthenticated) {
            console.log('[Security Gateway] Level-2 Authentication aborted. Remaining in public mode.');
            return { success: false, message: 'Authentication aborted.' };
        }
        
        return { success: true, message: 'Backend initialized.' };

    } catch (error) {
        console.error('[Security Gateway] Connection error:', error.message);
        return { success: false, message: 'Security server unreachable.' };
    }
}