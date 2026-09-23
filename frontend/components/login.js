/**
 * ============================================================================
 * MODULE: /frontend/components/login.js
 * DESCRIPTION: The OS Security Gateway. 
 * Authenticates real users against the AWS PostgreSQL database via Express.
 * ============================================================================
 */

export async function initLogin() {
    return new Promise((resolve) => {
        const root = document.getElementById('tao-os-root') || document.body;
        
        const lockLayer = document.createElement('div');
        Object.assign(lockLayer.style, {
            position: 'fixed', inset: '0', backgroundColor: '#020617',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
            zIndex: 60000, pointerEvents: 'auto', opacity: '0', transition: 'opacity 0.5s ease'
        });
        root.appendChild(lockLayer);

        requestAnimationFrame(() => { lockLayer.style.opacity = '1'; });

        let isRegisterMode = false;

        const renderForm = () => {
            const textWelcome = "EXTRAORDINARY ME !!!";
            const textLoginBtn = "SIGN IN";
            const textRegisterBtn = "REGISTER";
            const textPlaceholder = "Username";

            lockLayer.innerHTML = `
                <style>
                    .auth-card {
                        background: #0f172a; padding: 40px 20px; border-radius: 12px;
                        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8); width: 92%; max-width: 350px;
                        display: flex; flex-direction: column; gap: 15px; box-sizing: border-box;
                        border: 1px solid #334155;
                    }
                    .auth-title { margin: 0 0 10px 0; color: #fff; text-align: center; font-size: 20px; letter-spacing: 1px; }
                    .auth-input {
                        padding: 14px; border-radius: 8px; border: 1px solid #334155;
                        background: #1e293b; color: #fff; font-size: 16px; font-family: inherit; 
                        outline: none; -webkit-appearance: none; width: 100%; box-sizing: border-box;
                    }
                    .auth-input:focus { border-color: #ffd700; }
                    .auth-btn {
                        padding: 14px; background: #ffd700; color: #0f172a; font-weight: 900;
                        font-size: 16px; border: none; border-radius: 25px; cursor: pointer;
                        transition: background 0.2s; margin-top: 10px; -webkit-appearance: none;
                    }
                    .auth-btn:hover { background: #e6c200; }
                    .auth-link { color: #94a3b8; font-size: 14px; text-align: center; cursor: pointer; margin-top: 5px; padding: 10px; }
                    .auth-error { color: #ef4444; font-size: 13px; text-align: center; display: none; margin-bottom: -5px; }
                    .legal-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; margin-top: -5px; }
                    .legal-row input { cursor: pointer; accent-color: #ffd700; width: 20px; height: 20px; }
                </style>
                <div class="auth-card">
                    <h2 class="auth-title">${textWelcome}</h2>
                    <div id="error-msg" class="auth-error"></div>
                    
                    <input type="text" class="auth-input" placeholder="${textPlaceholder}" id="auth-user" autocomplete="username">
                    
                    ${isRegisterMode ? `<input type="email" class="auth-input" placeholder="Email Address" id="auth-email" autocomplete="email">` : ''}
                    
                    <input type="password" class="auth-input" placeholder="Password" id="auth-pass" autocomplete="${isRegisterMode ? 'new-password' : 'current-password'}">
                    
                    ${isRegisterMode ? `
                        <input type="password" class="auth-input" placeholder="Confirm Password" id="auth-pass-confirm" autocomplete="new-password">
                        <label class="legal-row">
                            <input type="checkbox" id="auth-legal"> I agree to the Legal Terms of Service
                        </label>
                    ` : ''}

                    <button class="auth-btn" id="submit-btn">${isRegisterMode ? textRegisterBtn : textLoginBtn}</button>
                    <div class="auth-link" id="toggle-btn">
                        ${isRegisterMode ? 'Already have an account? Sign In' : 'Need an account? Register'}
                    </div>
                </div>
            `;

            document.getElementById('toggle-btn').addEventListener('click', () => {
                isRegisterMode = !isRegisterMode;
                renderForm();
            });

            document.getElementById('submit-btn').addEventListener('click', async () => {
                const user = document.getElementById('auth-user').value.trim();
                const pass = document.getElementById('auth-pass').value;
                const errorEl = document.getElementById('error-msg');
                const submitBtn = document.getElementById('submit-btn');
                
                const showError = (msg) => { errorEl.textContent = msg; errorEl.style.display = 'block'; };
                errorEl.style.display = 'none';

                if (user.length < 3) return showError("Username must be at least 3 characters.");
                if (pass.length < 5) return showError("Password must be at least 5 characters.");

                let email = '';
                if (isRegisterMode) {
                    email = document.getElementById('auth-email').value.trim();
                    const passConfirm = document.getElementById('auth-pass-confirm').value;
                    const legalChecked = document.getElementById('auth-legal').checked;
                    
                    if (!email.includes('@')) return showError("Please enter a valid email address.");
                    if (pass !== passConfirm) return showError("Passwords do not match.");
                    if (!legalChecked) return showError("You must agree to the legal terms.");
                }

                submitBtn.textContent = 'PROCESSING...';
                submitBtn.disabled = true;

                // ============================================================
                // 🚀 REAL AWS DATABASE AUTHENTICATION
                // ============================================================
                try {
                    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
                    const payload = isRegisterMode 
                        ? { username: user, email: email, password: pass }
                        : { username: user, password: pass };

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (!data.success) {
                        submitBtn.textContent = isRegisterMode ? textRegisterBtn : textLoginBtn;
                        submitBtn.disabled = false;
                        return showError(data.error || "Authentication failed.");
                    }

                    lockLayer.style.opacity = '0';
                    setTimeout(() => {
                        lockLayer.remove();
                        
                        // ============================================================
                        // 🚀 MAP POSTGRESQL DATA TO BOOTLOADER PAYLOAD
                        // Extracts 'id', 'username', and 'designation' directly from the DB response
                        // Falls back to local 'user' text input if backend mapping is incomplete
                        // ============================================================
                        resolve({
                            auth: true,
                            userId: data.user?.id || data.user_id, 
                            username: data.user?.username || user, 
                            designation: data.user?.designation || data.payload?.clearance || 'Explorer',
                            isNewAccount: isRegisterMode,
                            paidTier: data.user?.paidTier || 'no'
                        });
                    }, 500);

                } catch (err) {
                    submitBtn.textContent = isRegisterMode ? textRegisterBtn : textLoginBtn;
                    submitBtn.disabled = false;
                    showError("Unable to connect to OS Backend.");
                }
            });
        };

        renderForm();
    });
}