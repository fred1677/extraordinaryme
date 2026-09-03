// src/legals.js

export const LEGAL_TERMS = {
    version: '1.0.0',
    title: 'Terms of Service & Privacy Policy',
    lastUpdated: '2026-09-02',
    content: `
1. Creative Agency & Ownership:
All custom narrative lines, companion designations, uploaded artifacts (media, links, text), and personal records created in ExtraordinaryMe remain strictly your property.

2. Privacy & Personal Data Integrity:
Your data is private to your authenticated identity. We do not sell your narrative, uploads, or identity details to third parties.

3. Acceptable Use:
You agree not to upload malicious payloads, automated abuse scripts, or content that infringes upon the intellectual property or safety of others.

4. Dynamic Evolution & Updates:
As ExtraordinaryMe adds features, updated terms may be released. Material revisions will require re-acknowledgment upon login.
    `.trim()
};

export function showLegalModal() {
    const existing = document.getElementById('legal-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'legal-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;';

    modal.innerHTML = `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;width:100%;max-width:550px;padding:1.75rem;color:#f8fafc;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;border-bottom:1px solid #334155;padding-bottom:0.75rem;">
                <h3 style="margin:0;font-size:1.25rem;">${LEGAL_TERMS.title} (v${LEGAL_TERMS.version})</h3>
                <button id="close-legal-modal" style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;">&times;</button>
            </div>
            <div style="max-height:320px;overflow-y:auto;white-space:pre-wrap;font-size:0.9rem;line-height:1.6;color:#cbd5e1;padding-right:0.5rem;margin-bottom:1.5rem;">
${LEGAL_TERMS.content}
            </div>
            <div style="text-align:right;">
                <button id="confirm-legal-modal" style="padding:0.6rem 1.25rem;background:#4f46e5;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    document.getElementById('close-legal-modal').addEventListener('click', closeModal);
    document.getElementById('confirm-legal-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}