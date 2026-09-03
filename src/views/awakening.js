// src/views/awakening.js
import { createButton } from '../components/buttons.js';

export function render() {
    return `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; padding: 1.5rem; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; width: 100%; max-width: 520px; padding: 2.5rem; color: #f8fafc; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);">
                
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">✨</div>
                    <h2 style="font-size: 1.6rem; font-weight: 700; margin: 0 0 0.5rem;">Awaken Your Companion</h2>
                    <p style="color: #94a3b8; font-size: 0.9rem; margin: 0; line-height: 1.5;">
                        Configure your AI companion's identity and greeting to complete onboarding.
                    </p>
                </div>

                <div id="awakening-alert" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem;"></div>

                <form id="awakening-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.4rem; font-weight: 600;">Companion Name</label>
                        <input type="text" id="companion-name" required placeholder="e.g., Nova, Echo, Sage" style="width: 100%; padding: 0.7rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box;">
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.4rem; font-weight: 600;">Awakening Greeting</label>
                        <textarea id="awakening-announcement" rows="3" required placeholder="What should your companion say when you arrive?" style="width: 100%; padding: 0.7rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box; resize: vertical;"></textarea>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.4rem; font-weight: 600;">Origin Story / Role</label>
                        <textarea id="origin-story" rows="2" placeholder="Describe the purpose or background of your companion..." style="width: 100%; padding: 0.7rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; box-sizing: border-box; resize: vertical;"></textarea>
                    </div>

                    ${createButton({ id: 'btn-awaken-submit', text: 'Awaken Companion', variant: 'primary', size: 'lg', type: 'submit', extraStyle: 'width: 100%; justify-content: center; margin-top: 0.5rem;' })}
                </form>

            </div>
        </div>
    `;
}

export function init() {
    const form = document.getElementById('awakening-form');
    const alertEl = document.getElementById('awakening-alert');
    const token = localStorage.getItem('auth_token');

    // Pre-populate if revisiting an already-created profile
    fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        if (data.profile) {
            if (data.profile.companion_name) document.getElementById('companion-name').value = data.profile.companion_name;
            if (data.profile.awakening_announcement) document.getElementById('awakening-announcement').value = data.profile.awakening_announcement;
            if (data.profile.origin_story) document.getElementById('origin-story').value = data.profile.origin_story;
        }
    })
    .catch(() => {});

    function showAlert(text, isError = true) {
        alertEl.innerText = text;
        alertEl.style.display = 'block';
        alertEl.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        alertEl.style.color = isError ? '#f87171' : '#4ade80';
        alertEl.style.border = `1px solid ${isError ? '#ef4444' : '#22c55e'}`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alertEl.style.display = 'none';

        const companion_name = document.getElementById('companion-name').value.trim();
        const awakening_announcement = document.getElementById('awakening-announcement').value.trim();
        const origin_story = document.getElementById('origin-story').value.trim();

        if (!companion_name) {
            showAlert('Please name your companion.');
            return;
        }

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    companion_name,
                    awakening_announcement,
                    origin_story
                })
            });

            const data = await res.json();
            if (!res.ok) {
                showAlert(data.error || 'Failed to complete awakening.');
                return;
            }

            // Onboarding complete: route to home
            window.location.hash = '#home';
        } catch (err) {
            showAlert('Server communication error.');
        }
    });
}

export function cleanup() {}