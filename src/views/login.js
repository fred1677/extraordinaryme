// src/views/login.js
import { showLegalModal } from '../legals.js';
import { createButton } from '../components/buttons.js';

export function render() {
    return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; width: 100%; max-width: 420px; padding: 2rem; color: #f8fafc; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                
                <h2 id="auth-title" style="margin: 0 0 0.5rem; font-size: 1.5rem; font-weight: 700; text-align: center;">Welcome Back</h2>
                <p id="auth-sub" style="margin: 0 0 1.5rem; color: #94a3b8; font-size: 0.9rem; text-align: center;">Sign in to your ExtraordinaryMe account</p>

                <div id="auth-alert" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.4;"></div>

                <form id="auth-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label id="auth-user-label" style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.35rem;">Username or Email</label>
                        <input type="text" id="auth-username" required style="width: 100%; padding: 0.65rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box;">
                        <div id="username-helper" style="display: none; font-size: 0.75rem; color: #64748b; margin-top: 0.35rem;">
                            3-30 characters. Letters, numbers, underscores (_), and hyphens (-) only. (Not case sensitive)
                        </div>
                    </div>

                    <div id="email-field-group" style="display: none;">
                        <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.35rem;">Email Address</label>
                        <input type="email" id="auth-email" style="width: 100%; padding: 0.65rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.35rem;">Password</label>
                        <div style="position: relative; width: 100%;">
                            <input type="password" id="auth-password" required style="width: 100%; padding: 0.65rem 2.6rem 0.65rem 0.65rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box;">
                            <button type="button" id="toggle-auth-password" title="Show or hide password" style="position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; color: #94a3b8; font-size: 1.1rem; line-height: 1; padding: 0.2rem;">
                                👁️
                            </button>
                        </div>
                        
                        <ul id="password-checklist" style="display: none; font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; padding-left: 0; list-style: none; flex-direction: column; gap: 0.25rem;">
                            <li id="req-len" data-text="Min 8 characters">○ Min 8 characters</li>
                            <li id="req-upper" data-text="1 uppercase letter">○ 1 uppercase letter</li>
                            <li id="req-num" data-text="1 number">○ 1 number</li>
                            <li id="req-spec" data-text="1 special character">○ 1 special character</li>
                        </ul>
                    </div>

                    <div id="agreement-checkbox-group" style="display: none; margin-top: 0.25rem;">
                        <label style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #cbd5e1; cursor: pointer; line-height: 1.4;">
                            <input type="checkbox" id="auth-agreement-check" style="margin-top: 0.15rem; cursor: pointer;">
                            <span>
                                I have read and accept the 
                                <a href="javascript:void(0)" id="view-terms-link" style="color: #818cf8; text-decoration: underline; font-weight: 600;">
                                    Terms & Privacy Policy
                                </a>
                            </span>
                        </label>
                    </div>

                    ${createButton({ id: 'auth-submit-btn', text: 'Sign In', variant: 'primary', size: 'lg', type: 'submit', extraStyle: 'width: 100%; justify-content: center; margin-top: 0.5rem;' })}
                </form>

                <div style="margin-top: 1.25rem; text-align: center; font-size: 0.85rem; color: #94a3b8;">
                    <span id="auth-toggle-prompt">Don't have an account?</span>
                    <button id="auth-toggle-btn" style="background: none; border: none; color: #818cf8; font-weight: 600; cursor: pointer; margin-left: 0.35rem; text-decoration: underline;">
                        Sign Up
                    </button>
                </div>

            </div>
        </div>
    `;
}

export function init() {
    let isSignupMode = false;

    const titleEl = document.getElementById('auth-title');
    const subEl = document.getElementById('auth-sub');
    const userLabel = document.getElementById('auth-user-label');
    const userHelper = document.getElementById('username-helper');
    const passChecklist = document.getElementById('password-checklist');
    const passInput = document.getElementById('auth-password');
    const togglePassBtn = document.getElementById('toggle-auth-password');
    const emailGroup = document.getElementById('email-field-group');
    const emailInput = document.getElementById('auth-email');
    const agreementGroup = document.getElementById('agreement-checkbox-group');
    const agreementCheck = document.getElementById('auth-agreement-check');
    const submitBtn = document.getElementById('auth-submit-btn');
    const togglePrompt = document.getElementById('auth-toggle-prompt');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const alertEl = document.getElementById('auth-alert');
    const form = document.getElementById('auth-form');
    const viewTermsLink = document.getElementById('view-terms-link');

    // Toggle password visibility
    if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
            const isText = passInput.type === 'text';
            passInput.type = isText ? 'password' : 'text';
            togglePassBtn.innerText = isText ? '👁️' : '🙈';
        });
    }

    if (viewTermsLink) {
        viewTermsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLegalModal();
        });
    }

    function showAlert(textOrArray, isError = true) {
        let htmlContent = '';
        if (Array.isArray(textOrArray)) {
            htmlContent = '<ul style="margin: 0; padding-left: 1.2rem;">' + textOrArray.map(err => `<li>${err}</li>`).join('') + '</ul>';
        } else if (typeof textOrArray === 'object' && textOrArray !== null) {
            htmlContent = textOrArray.error || textOrArray.message || JSON.stringify(textOrArray);
        } else {
            htmlContent = textOrArray;
        }

        alertEl.innerHTML = htmlContent;
        alertEl.style.display = 'block';
        alertEl.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        alertEl.style.color = isError ? '#f87171' : '#4ade80';
        alertEl.style.border = `1px solid ${isError ? '#ef4444' : '#22c55e'}`;
    }

    function updateChecklistItem(el, isValid) {
        if (isValid) {
            el.style.color = '#4ade80';
            el.innerText = '✓ ' + el.dataset.text;
        } else {
            el.style.color = '#64748b';
            el.innerText = '○ ' + el.dataset.text;
        }
    }

    passInput.addEventListener('input', (e) => {
        if (!isSignupMode) return;
        const val = e.target.value;
        updateChecklistItem(document.getElementById('req-len'), val.length >= 8);
        updateChecklistItem(document.getElementById('req-upper'), /[A-Z]/.test(val));
        updateChecklistItem(document.getElementById('req-num'), /[0-9]/.test(val));
        updateChecklistItem(document.getElementById('req-spec'), /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val));
    });

    toggleBtn.addEventListener('click', () => {
        isSignupMode = !isSignupMode;
        alertEl.style.display = 'none';

        if (isSignupMode) {
            titleEl.innerText = 'Create Account';
            subEl.innerText = 'Awaken your ExtraordinaryMe companion';
            userLabel.innerText = 'Username or User ID';
            userHelper.style.display = 'block';
            passChecklist.style.display = 'flex';
            emailGroup.style.display = 'block';
            emailInput.required = true;
            agreementGroup.style.display = 'block';
            submitBtn.innerText = 'Create Account';
            togglePrompt.innerText = 'Already have an account?';
            toggleBtn.innerText = 'Sign In';
            passInput.dispatchEvent(new Event('input'));
        } else {
            titleEl.innerText = 'Welcome Back';
            subEl.innerText = 'Sign in to your ExtraordinaryMe account';
            userLabel.innerText = 'Username or Email';
            userHelper.style.display = 'none';
            passChecklist.style.display = 'none';
            emailGroup.style.display = 'none';
            emailInput.required = false;
            agreementGroup.style.display = 'none';
            submitBtn.innerText = 'Sign In';
            togglePrompt.innerText = "Don't have an account?";
            toggleBtn.innerText = 'Sign Up';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertEl.style.display = 'none';

        // Normalize username to lowercase and trim whitespace
        const username = document.getElementById('auth-username').value.trim().toLowerCase();
        const password = document.getElementById('auth-password').value;

        if (isSignupMode) {
            // Normalize email to lowercase and trim
            const email = emailInput.value.trim().toLowerCase();
            let errors = [];

            if (username.length < 3 || username.length > 30) {
                errors.push('Username must be 3-30 characters long.');
            }
            if (!/^[a-z0-9_-]+$/.test(username)) {
                errors.push('Username can only contain letters, numbers, underscores, and hyphens.');
            }

            const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
            if (!emailPattern.test(email)) {
                errors.push('Please provide a valid email address.');
            }

            if (password.length < 8) errors.push('Password must be at least 8 characters long.');
            if (!/[A-Z]/.test(password)) errors.push('Password requires at least one uppercase letter (A-Z).');
            if (!/[0-9]/.test(password)) errors.push('Password requires at least one numeric digit (0-9).');
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password requires at least one special character.');

            if (!agreementCheck.checked) {
                errors.push('You must read and agree to the Terms & Privacy Policy.');
            }

            if (errors.length > 0) {
                showAlert(errors);
                return;
            }

            try {
                const agreeRes = await fetch('/api/agreements/active');
                const agreeData = await agreeRes.json();
                const agreementId = agreeData.agreement ? agreeData.agreement.id : null;

                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username,
                        email,
                        password,
                        agreement_id: agreementId
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    showAlert(data.error || 'Failed to create account.');
                    return;
                }

                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                
                // Brand new signups are redirected straight to awakening onboarding
                window.location.hash = '#awakening';
            } catch (err) {
                showAlert('Server communication error.');
            }
        } else {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();
                if (!res.ok) {
                    showAlert(data.error || 'Login failed.');
                    return;
                }

                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                
                // Return to previous route if recorded, otherwise default to #home
                const returnRoute = localStorage.getItem('last_visited_route') || 'home';
                window.location.hash = `#${returnRoute}`;
            } catch (err) {
                showAlert('Server communication error.');
            }
        }
    });
}

export function cleanup() {}