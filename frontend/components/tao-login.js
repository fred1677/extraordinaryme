/**
 * ============================================================================
 * MODULE: /frontend/components/tao-login.js
 * DESCRIPTION: Level-2 Security Gateway.
 * Dedicated UI for authenticating Taousers into the backend workspace.
 * ============================================================================
 */

export async function initTaoLogin() {
    return new Promise((resolve) => {
        const root = document.getElementById('tao-os-root') || document.body;
        const isNew = window.TAO_USER_CONFIG?.requires_password_change;
        
        const lockLayer = document.createElement('div');
        Object.assign(lockLayer.style, {
            position: 'fixed', inset: '0', backgroundColor: 'rgba(2, 6, 23, 0.95)',
            backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace', 
            zIndex: 70000, pointerEvents: 'auto', opacity: '0', transition: 'opacity 0.5s ease'
        });
        root.appendChild(lockLayer);

        requestAnimationFrame(() => { lockLayer.style.opacity = '1'; });

        lockLayer.innerHTML = `
            <div style="background: #0f172a; padding: 40px; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); border: 1px solid #334155; width: 90%; max-width: 380px; display: flex; flex-direction: column; gap: 15px;">
                <div style="color: #38bdf8; font-weight: bold; margin-bottom: 8px; text-align: center; font-size: 16px; letter-spacing: 1px;">
                    ${isNew ? 'INITIALIZE LEVEL-2 CLEARANCE' : 'LEVEL-2 SECURITY PROTOCOL'}
                </div>
                <div style="color: #94a3b8; font-size: 13px; margin-bottom: 20px; text-align: center; line-height: 1.5;">
                    ${isNew ? 'System detects temporary clearance.<br>Please set your permanent Taouser password.' : 'Enter your encrypted Taouser password<br>to access the backend interface.'}
                </div>
                <div id="tao-login-error" style="color: #ef4444; font-size: 13px; text-align: center; display: none; margin-bottom: -5px;"></div>
                <input type="password" id="tao-backend-pass" placeholder="${isNew ? 'New Password' : 'Password'}" style="
                    width: 100%; padding: 14px; border-radius: 8px; border: 1px solid #334155;
                    background: #1e293b; color: #fff; outline: none; font-size: 16px; box-sizing: border-box;
                ">
                <div style="display: flex; gap: 12px; width: 100%; margin-top: 10px;">
                    <button id="tao-pass-cancel" style="flex: 1; padding: 12px; background: transparent; border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background 0.2s;">Abort</button>
                    <button id="tao-pass-submit" style="flex: 1; padding: 12px; background: #22c55e; border: none; color: #0f172a; font-weight: bold; border-radius: 8px; cursor: pointer; transition: background 0.2s;">Authenticate</button>
                </div>
            </div>
        `;

        const inputEl = lockLayer.querySelector('#tao-backend-pass');
        const errorEl = lockLayer.querySelector('#tao-login-error');
        const submitBtn = lockLayer.querySelector('#tao-pass-submit');
        const cancelBtn = lockLayer.querySelector('#tao-pass-cancel');

        inputEl.focus();

        const showError = (msg) => {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        };

        cancelBtn.onclick = () => {
            lockLayer.style.opacity = '0';
            setTimeout(() => { lockLayer.remove(); resolve(false); }, 500);
            
            // Re-open chatbox if aborted
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
        };

        submitBtn.onclick = async () => {
            const pass = inputEl.value;
            if (!pass) return;

            errorEl.style.display = 'none';
            submitBtn.innerText = 'Verifying...';
            submitBtn.disabled = true;

            try {
                const activeUserId = localStorage.getItem('TAO_SESSION_TOKEN');

                const response = await fetch('/api/auth/verify-taouser', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: activeUserId, password: pass })
                });

                const data = await response.json();

                if (!data.success) {
                    submitBtn.innerText = 'Authenticate';
                    submitBtn.disabled = false;
                    inputEl.value = ''; 
                    return showError(`[Security] ${data.error || 'Authorization Failed.'}`);
                }

                // Authentication Successful
                lockLayer.style.opacity = '0';
                if (window.TAO_USER_CONFIG) {
                    window.TAO_USER_CONFIG.requires_password_change = false;
                }

                setTimeout(async () => {
                    lockLayer.remove();
                    try {
                        // 🚀 FIX: Correctly imports initTaoHomeScreen and adds a cache buster
                        const { initTaoHomeScreen } = await import('../screen-panels/tao-home-screen.js?v=' + new Date().getTime());
                        await initTaoHomeScreen();
                        resolve(true);
                    } catch (err) {
                        console.error('Failed to load backend desktop.', err);
                        resolve(false);
                    }
                }, 500);

            } catch (err) {
                submitBtn.innerText = 'Authenticate';
                submitBtn.disabled = false;
                showError('Unable to connect to security server.');
            }
        };
    });
}