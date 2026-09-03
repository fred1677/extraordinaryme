// src/utils/helpContent.js

export const HELP_TOPICS = {
    global: {
        title: 'Platform Overview',
        content: `
• ExtraordinaryMe allows you to shape, converse with, and preserve your companion entity.
• Access your Awakening flow anytime to update your companion's voice or origin story.
• Legal agreements and terms can be reviewed through the authentication portal.
        `.trim()
    },
    admin_auth_rules: {
        title: 'Runtime Authentication Rules',
        adminOnly: true,
        content: `
• Sliders set constraints for incoming accounts and password resets.
• "Save Live Rules": Immediately alters sign-up validation without a server restart.
• "Enforce Strict & Flag 30 Days": Activates production-grade complexity and starts a 30-day grace period for legacy accounts.
        `.trim()
    },
    admin_user_directory: {
        title: 'User Management & Compliance',
        adminOnly: true,
        content: `
• Toggle "Deactivate" to suspend a user without deleting their artifacts.
• Accounts marked "Flagged" have not upgraded credentials within the required window.
• Deleting a user permanently purges their profile, legal acceptances, and identity records.
        `.trim()
    },
    companion_awakening: {
        title: 'Companion Awakening Flow',
        content: `
• Set your companion's preferred designation (defaults to 'Me').
• Define awakening announcement prompts that trigger upon entering your space.
• Upload origin artifacts or media attachments to ground your companion's context.
        `.trim()
    }
};

export function openHelpModal(topicKey) {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const isAdmin = user.role === 'admin';
    const topic = HELP_TOPICS[topicKey] || HELP_TOPICS.global;

    if (topic.adminOnly && !isAdmin) return;

    const existing = document.getElementById('context-help-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'context-help-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;font-family:system-ui,-apple-system,sans-serif;';

    modal.innerHTML = `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:480px;padding:1.5rem;color:#f8fafc;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;border-bottom:1px solid #334155;padding-bottom:0.5rem;">
                <h3 style="margin:0;font-size:1.15rem;display:flex;align-items:center;gap:0.5rem;">
                    <span>💡</span> ${topic.title}
                </h3>
                <button id="close-context-help" style="background:none;border:none;color:#94a3b8;font-size:1.4rem;cursor:pointer;line-height:1;">&times;</button>
            </div>
            <div style="white-space:pre-wrap;font-size:0.9rem;line-height:1.6;color:#cbd5e1;margin-bottom:1.25rem;">${topic.content}</div>
            <div style="text-align:right;">
                <button id="ok-context-help" style="padding:0.45rem 1rem;background:#4f46e5;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:0.85rem;">
                    Got It
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    document.getElementById('close-context-help').addEventListener('click', close);
    document.getElementById('ok-context-help').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });
}