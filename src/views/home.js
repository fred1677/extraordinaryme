// src/views/home.js
import { StandardButtons } from '../components/buttons.js';

export function render() {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isAdmin = user.role === 'admin';

    return `
        <div style="min-height: 100vh; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding: 2rem;">
            <div style="max-width: 800px; margin: 0 auto;">
                
                <!-- Navigation Header -->
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem;">
                    <div>
                        <h1 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0;">ExtraordinaryMe</h1>
                        <span style="font-size: 0.9rem; color: #64748b;">Welcome, ${user.username || 'Traveler'}</span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${isAdmin ? StandardButtons.admin() : ''}
                        ${StandardButtons.help()}
                        ${StandardButtons.logout()}
                    </div>
                </header>

                <!-- Dynamic State Container -->
                <div id="companion-state-container">
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; text-align: center; color: #64748b;">
                        Loading your companion status...
                    </div>
                </div>

                <!-- Admin & Management Actions -->
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h3 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem 0;">Account Actions</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${isAdmin ? `
                        <button onclick="window.location.hash = '#admin'" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 1px solid #c7d2fe; border-radius: 8px; background: #eef2ff; color: #3730a3; font-weight: 600; cursor: pointer; text-align: left;">
                            ⚙️ Open Admin Console
                        </button>
                        ` : `
                        <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">Standard account active.</p>
                        `}
                    </div>
                </div>

            </div>
        </div>
    `;
}

export async function init() {
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.hash = '#login';
        });
    }

    const token = localStorage.getItem('auth_token');
    const container = document.getElementById('companion-state-container');

    try {
        const res = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const profile = data.profile || {};

        // A companion is only awakened if they have a companion_name or awakening prompt configured
        const isAwakened = Boolean(profile.companion_name || profile.awakening_announcement);

        if (isAwakened) {
            // Returning Awakened User UI
            container.innerHTML = `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                        <h2 style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0;">
                            ✨ Companion Active: ${profile.companion_name || 'Awakened'}
                        </h2>
                        ${StandardButtons.sectionInfo('companion_basics')}
                    </div>
                    <p style="color: #475569; font-style: italic; margin: 0 0 1.25rem 0; line-height: 1.5;">
                        "${profile.awakening_announcement || 'I am awakened and ready to assist you. What shall we focus on today?'}"
                    </p>
                    <button onclick="window.location.hash = '#awakening'" style="background: none; border: 1px solid #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; color: #475569; font-size: 0.8rem; cursor: pointer;">
                        Revisit Awakening Flow
                    </button>
                </div>
            `;
        } else {
            // Brand-New / Unawakened User UI
            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; padding: 2rem; color: white; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🌱</div>
                    <h2 style="font-size: 1.3rem; font-weight: 700; margin: 0 0 0.5rem 0;">Your Companion Is Sleeping</h2>
                    <p style="color: #94a3b8; font-size: 0.95rem; max-width: 460px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
                        You have not awakened your ExtraordinaryMe companion yet. Begin the initiation flow to give your companion form and purpose.
                    </p>
                    <button onclick="window.location.hash = '#awakening'" style="background: #6366f1; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">
                        ✨ Begin Awakening Ceremony
                    </button>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = `<div style="color: #ef4444; padding: 1rem;">Failed to load companion profile.</div>`;
    }
}

export function cleanup() {}