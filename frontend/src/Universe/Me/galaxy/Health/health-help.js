/**
 * ============================================================================
 * MODULE: health-help.js
 * 
 * DESCRIPTION:
 * Comprehensive Help overlay for the decoupled Health application.
 * Triggered via the 'tao-help-clicked' OS Signal from the Window Manager.
 * Generates a localized, glass-morphism scrollable guide inside the Health window.
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99999', 
        borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
        padding: '24px', boxSizing: 'border-box'
    });

    // Create the white modal box (Expanded for documentation)
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#ffffff', padding: '0', borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column',
        border: '1px solid #e2e8f0', width: '100%', maxWidth: '650px', maxHeight: '100%', pointerEvents: 'auto',
        overflow: 'hidden'
    });

    // Header Area (Sticky)
    const header = document.createElement('div');
    Object.assign(header.style, {
        padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '12px', flexShrink: '0'
    });

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    
    const title = document.createElement('h3');
    title.innerText = "Health Workspace Guide";
    Object.assign(title.style, { color: '#0f172a', margin: '0', fontFamily: 'sans-serif', fontSize: '18px' });

    header.appendChild(icon);
    header.appendChild(title);

    // Scrollable Content Area
    const content = document.createElement('div');
    Object.assign(content.style, {
        padding: '24px', overflowY: 'auto', color: '#334155', fontSize: '14px', 
        fontFamily: 'sans-serif', lineHeight: '1.6', flex: '1'
    });

    content.innerHTML = `
        <p style="margin-top:0; color:#64748b; font-size:15px;">Welcome to your modular Health Workspace. This system operates on a strict, privacy-first Universal Date Ledger.</p>
        
        <h4 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-top:24px;">1. The Universal Ledger & Midnight Rollover</h4>
        <p>This application does not rely on manual resets. An invisible, OS-level Timekeeper monitors your local timezone. At exactly <strong>12:00 AM</strong>, all tracking modules (Meals, Vitals, Sleep, etc.) will instantly wipe their inputs and roll over to a blank slate for the new day without requiring a page refresh.</p>

        <h4 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-top:24px;">2. Historical Editing (Time Travel)</h4>
        <p>To edit or view data from a previous day, simply change the <strong>Date input</strong> at the top of any specific module. </p>
        <ul style="padding-left:20px; margin-bottom:0;">
            <li>The global Chatbox will slide into view and ask you to confirm the time jump.</li>
            <li>Once confirmed, the module will load the exact AWS state for that specific day.</li>
            <li>Click <strong>[Return to Today]</strong> to jump back to the active ledger.</li>
        </ul>

        <h4 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-top:24px;">3. Module Breakdown</h4>
        <ul style="padding-left:20px;">
            <li style="margin-bottom:8px;"><strong>Profile & Baseline:</strong> The anchor of the app. Your age, sex, height, and weight are used to calculate dynamic Daily Calorie Targets and clinical micronutrient baselines.</li>
            <li style="margin-bottom:8px;"><strong>Wake & Sleep:</strong> Automatically calculates total sleep duration spanning across midnight from yesterday's ledger into today's.</li>
            <li style="margin-bottom:8px;"><strong>Daily Weight:</strong> Tracks morning and evening fluctuations, reporting exact kg/lbs gained or lost since yesterday.</li>
            <li style="margin-bottom:8px;"><strong>Vitals:</strong> Pre-populates with standard templates (Blood Pressure, Heart Rate, etc.). Allows custom vitals. Features auto-timestamping upon entry.</li>
            <li style="margin-bottom:8px;"><strong>Meals:</strong> Utilizes stackable blocks. You can re-categorize blocks (e.g., "Snack" to "Other") using the Chatbox prompt. Every block features auto-saving.</li>
            <li style="margin-bottom:8px;"><strong>Exercise:</strong> A free-text journaling block that auto-timestamps your latest activity modifications.</li>
        </ul>

        <h4 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-top:24px;">4. Trashcan Recovery</h4>
        <p>Accidentally deleted a Meal or Vital block? Do not panic. A red <strong>[Open Trash]</strong> button will appear at the bottom of the module. Click it to reveal deleted blocks for the current day and hit <strong>[Recover]</strong> to restore them instantly.</p>

        <h4 style="color:#0f172a; border-bottom:2px solid #e2e8f0; padding-bottom:6px; margin-top:24px;">5. The Snapshot Dossier</h4>
        <p style="margin-bottom:0;">Clicking the <strong>Snapshot</strong> button in the top-right window header gathers all data from your active decoupled ledgers. It audits your daily caloric and nutrient intake against clinical RDAs based on your demographic profile, identifies specific deficiencies, and generates a comprehensive, shareable PDF dossier.</p>
    `;

    // Footer Area (Sticky)
    const footer = document.createElement('div');
    Object.assign(footer.style, {
        padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'flex-end', flexShrink: '0'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "Acknowledge & Close";
    Object.assign(closeBtn.style, {
        backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none',
        padding: '10px 24px', borderRadius: '6px', cursor: 'pointer',
        fontWeight: 'bold', fontSize: '13px', transition: 'background-color 0.2s'
    });
    
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#0284c7'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#0ea5e9'; };
    
    // Smooth fade out and removal
    closeBtn.onclick = () => {
        overlay.style.transition = 'opacity 0.2s ease';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    };

    footer.appendChild(closeBtn);

    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Fade in animation
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease';
    parentWindow.appendChild(overlay);
    
    // Trigger fade in
    setTimeout(() => overlay.style.opacity = '1', 10);
}