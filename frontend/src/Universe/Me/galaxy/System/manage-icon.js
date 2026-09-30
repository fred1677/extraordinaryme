/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/System/manage-icon.js
 * 
 * DESCRIPTION:
 * The administrative GUI for adding new SVG icons into the TAO OS database.
 * Feeds directly into the system_icons table.
 * ============================================================================
 */

export async function initManageIcon(container) {
    const moduleName = "Icon Manager"; 
    const safeId = "icon-manager";
    const activeUserId = localStorage.getItem('TAO_SESSION_TOKEN');
    
    if (!container && document.getElementById(`tao-${safeId}-window`)) {
        const existingWin = document.getElementById(`tao-${safeId}-window`);
        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWin);
        return;
    }

    let targetArea = container;
    let appWindow = null;

    if (!targetArea) {
        appWindow = document.createElement('div');
        appWindow.id = `tao-${safeId}-window`;
        appWindow.classList.add('tao-workspace-window', 'is-floating');
        
        Object.assign(appWindow.style, {
            position: 'fixed', top: '20%', left: '30%', width: '420px', height: 'auto',
            backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', 
            pointerEvents: 'auto', zIndex: '21000'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        targetArea = appWindow;
    }

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        fontFamily: 'sans-serif', fontSize: '13px', color: '#0f172a'
    });

    contentArea.innerHTML = `
        <h3 style="margin: 0 0 8px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">System Icon Registry</h3>
        <p style="color: #64748b; margin-top: 0;">Upload new SVG icons to the master database.</p>
    `;

    // --- Form Fields ---
    const createInputWrap = (labelText) => {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
        const lbl = document.createElement('label');
        lbl.innerText = labelText;
        Object.assign(lbl.style, { fontWeight: 'bold', color: '#475569' });
        wrap.appendChild(lbl);
        return wrap;
    };

    const nameWrap = createInputWrap('Icon Name (e.g., "Chart / Productivity"):');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Enter display name...';
    Object.assign(nameInput.style, { padding: '8px 12px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', backgroundColor: '#f8fafc' });
    nameWrap.appendChild(nameInput);

    const svgWrap = createInputWrap('Raw SVG Code:');
    const svgInput = document.createElement('textarea');
    svgInput.placeholder = '<svg>...</svg>';
    Object.assign(svgInput.style, { padding: '8px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', backgroundColor: '#f8fafc', minHeight: '80px', fontFamily: 'monospace', resize: 'vertical' });
    svgWrap.appendChild(svgInput);

    // --- Live Preview Box ---
    const previewWrap = createInputWrap('Live Preview:');
    const previewBox = document.createElement('div');
    Object.assign(previewBox.style, { width: '44px', height: '44px', backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', overflow: 'hidden' });
    previewWrap.appendChild(previewBox);

    // Update preview when typing
    svgInput.addEventListener('input', () => {
        const val = svgInput.value.trim();
        if (val.toLowerCase().startsWith('<svg')) {
            // Scale it to fit nicely in the 44x44 box just like the Home Screen
            previewBox.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; transform: scale(0.85); transform-origin: center; color: #ffffff;">${val}</div>`;
        } else {
            previewBox.innerHTML = '';
        }
    });

    const submitBtn = document.createElement('button');
    submitBtn.innerText = 'Register Icon to AWS';
    Object.assign(submitBtn.style, { backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' });

    const statusMsg = document.createElement('div');
    Object.assign(statusMsg.style, { fontSize: '12px', fontWeight: 'bold', textAlign: 'center', minHeight: '16px' });

    // --- Network Action ---
    submitBtn.onclick = async () => {
        const iconName = nameInput.value.trim();
        const svgString = svgInput.value.trim();

        if (!iconName || !svgString) {
            statusMsg.style.color = '#ef4444'; 
            statusMsg.innerText = 'Please provide both a name and SVG code.'; 
            return;
        }

        submitBtn.innerText = 'Registering...';
        
        try {
            const res = await fetch('/api/system/icons', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': activeUserId 
                },
                body: JSON.stringify({ iconName, svgString })
            });
            
            const data = await res.json();
            
            if (data.success) {
                statusMsg.style.color = '#10b981';
                statusMsg.innerText = 'Icon added! App Manager can now access it.';
                nameInput.value = '';
                svgInput.value = '';
                previewBox.innerHTML = '';
            } else {
                throw new Error(data.error || 'Server rejected the request.');
            }
        } catch (err) {
            statusMsg.style.color = '#ef4444'; 
            statusMsg.innerText = `Error: ${err.message}`;
        }
        
        submitBtn.innerText = 'Register Icon to AWS';
    };

    contentArea.appendChild(nameWrap);
    contentArea.appendChild(svgWrap);
    contentArea.appendChild(previewWrap);
    contentArea.appendChild(submitBtn);
    contentArea.appendChild(statusMsg);

    if (targetArea === appWindow) {
        appWindow.appendChild(contentArea);
        document.body.appendChild(appWindow);
    } else {
        targetArea.appendChild(contentArea);
    }
}