/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/System/AppManager.js
 * 
 * DESCRIPTION:
 * The administrative GUI for the Database-Driven Desktop.
 * Upgraded: Dynamically fetches available icons from the AWS system_icons table.
 * Enforces strict 'no-store' cache policies to guarantee live AWS reads.
 * ============================================================================
 */

export async function initAppManager(container) {
    const moduleName = "App Manager"; 
    const safeId = "app-manager";
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
            position: 'fixed', top: '15%', left: '25%', width: '420px', height: 'auto',
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
        <h3 style="margin: 0 0 8px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">System App Registry</h3>
        <p style="color: #64748b; margin-top: 0;">Register new modules or edit existing clearances.</p>
    `;

    // ========================================================================
    // 🚀 DYNAMIC ICON LIBRARY FETCH
    // Replaces the old hardcoded list with a live read from AWS
    // ========================================================================
    let iconLibrary = {};
    try {
        const iconRes = await fetch('/api/system/icons', {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        const iconData = await iconRes.json();
        if (iconData.success) {
            iconData.icons.forEach(row => {
                iconLibrary[row.icon_name] = row.svg_string;
            });
        }
    } catch (err) {
        console.error('Failed to load dynamic icons from AWS:', err);
    }
    // Always append the custom override option at the end
    iconLibrary["Custom (Paste URL or SVG)"] = "custom";

    const createInput = (labelText, placeholder, isSelect = false, options = []) => {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
        const lbl = document.createElement('label');
        lbl.innerText = labelText;
        Object.assign(lbl.style, { fontWeight: 'bold', color: '#475569' });
        
        let inp;
        if (isSelect) {
            inp = document.createElement('select');
            options.forEach(opt => {
                const el = document.createElement('option');
                el.value = opt; el.innerText = opt;
                inp.appendChild(el);
            });
        } else {
            inp = document.createElement('input');
            inp.type = 'text'; inp.placeholder = placeholder;
        }
        
        Object.assign(inp.style, {
            padding: '8px 12px', fontSize: '14px', border: '1px solid #cbd5e1', 
            borderRadius: '4px', outline: 'none', backgroundColor: '#f8fafc'
        });
        
        wrap.appendChild(lbl); wrap.appendChild(inp);
        return { wrap, inp };
    };

    // --- Action Mode Dropdown (Create vs Edit) ---
    const modeWrap = document.createElement('div');
    Object.assign(modeWrap.style, { display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '12px', borderBottom: '1px dashed #cbd5e1' });
    const modeLbl = document.createElement('label');
    modeLbl.innerText = 'Action Mode:';
    Object.assign(modeLbl.style, { fontWeight: 'bold', color: '#0f172a' });
    const modeSelect = document.createElement('select');
    modeSelect.innerHTML = `<option value="NEW">✨ Register New Application</option>`;
    Object.assign(modeSelect.style, { padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', cursor: 'pointer' });
    modeWrap.appendChild(modeLbl); modeWrap.appendChild(modeSelect);

    // Form Fields
    const appNameInput = createInput('Application Name:', '');
    
    const iconWrap = document.createElement('div');
    Object.assign(iconWrap.style, { display: 'flex', flexDirection: 'column', gap: '4px' });
    const iconLbl = document.createElement('label');
    iconLbl.innerText = 'Desktop Icon:';
    Object.assign(iconLbl.style, { fontWeight: 'bold', color: '#475569' });
    const iconControls = document.createElement('div');
    Object.assign(iconControls.style, { display: 'flex', gap: '12px', alignItems: 'center' });
    
    const iconSelect = document.createElement('select');
    Object.assign(iconSelect.style, { flex: '1', padding: '8px 12px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer' });
    
    // Dynamically populate dropdown from AWS database
    Object.keys(iconLibrary).forEach(key => {
        const opt = document.createElement('option'); 
        opt.value = key; 
        opt.innerText = key; 
        iconSelect.appendChild(opt);
    });
    
    const iconPreview = document.createElement('div');
    Object.assign(iconPreview.style, { width: '36px', height: '36px', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' });
    
    const customIconInput = document.createElement('input');
    customIconInput.type = 'text'; 
    customIconInput.placeholder = 'Paste raw SVG or Image URL here...';
    Object.assign(customIconInput.style, { width: '100%', padding: '8px 12px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none', backgroundColor: '#ffffff', display: 'none', marginTop: '4px' });

    const updateIconPreview = () => {
        const selected = iconSelect.value;
        if (selected === "Custom (Paste URL or SVG)") {
            customIconInput.style.display = 'block'; 
            iconPreview.innerHTML = `<span style="font-size:10px; color:#94a3b8;">?</span>`;
        } else {
            customIconInput.style.display = 'none'; 
            iconPreview.innerHTML = iconLibrary[selected] || '';
        }
    };
    iconSelect.onchange = updateIconPreview; 
    updateIconPreview(); 
    
    iconControls.appendChild(iconSelect); 
    iconControls.appendChild(iconPreview); 
    iconWrap.appendChild(iconLbl); 
    iconWrap.appendChild(iconControls); 
    iconWrap.appendChild(customIconInput);

    const jsPathInput = createInput('JS Module Path:', '');
    jsPathInput.inp.value = '../src/Universe/Me/galaxy/';
    const clearanceInput = createInput('Minimum Clearance Required:', '', true, ['Explorer', 'System', 'Godmode']);

    const submitBtn = document.createElement('button');
    submitBtn.innerText = 'Register Module';
    Object.assign(submitBtn.style, { backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '10px 16px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' });

    const statusMsg = document.createElement('div');
    Object.assign(statusMsg.style, { fontSize: '12px', fontWeight: 'bold', textAlign: 'center', minHeight: '16px' });

    // --- Dynamic Application Fetching ---
    let existingApps = [];
    const fetchRegistry = async () => {
        try {
            // STRICT NO-CACHE POLICY FOR AWS READS
            const res = await fetch(`/api/system/apps?userId=${activeUserId}`, {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            const data = await res.json();
            if (data.success) {
                existingApps = data.apps;
                const optGroup = document.createElement('optgroup');
                optGroup.label = "Edit Existing Apps";
                existingApps.forEach(app => {
                    const opt = document.createElement('option');
                    opt.value = app.app_name; opt.innerText = `Edit: ${app.app_name}`;
                    optGroup.appendChild(opt);
                });
                modeSelect.appendChild(optGroup);
            }
        } catch (err) { console.error('Failed to load registry list.'); }
    };
    fetchRegistry();

    // --- Handle Mode Switch ---
    modeSelect.onchange = () => {
        const selected = modeSelect.value;
        if (selected === "NEW") {
            appNameInput.inp.value = ''; appNameInput.inp.disabled = false;
            jsPathInput.inp.value = '../src/Universe/Me/galaxy/';
            clearanceInput.inp.value = 'Explorer';
            submitBtn.innerText = 'Register Module';
            submitBtn.style.backgroundColor = '#0ea5e9';
            iconSelect.value = Object.keys(iconLibrary)[0] || "Custom (Paste URL or SVG)";
            customIconInput.value = '';
            updateIconPreview();
        } else {
            const targetApp = existingApps.find(a => a.app_name === selected);
            if (targetApp) {
                appNameInput.inp.value = targetApp.app_name;
                appNameInput.inp.disabled = true; // Lock name to prevent breaking the database key
                jsPathInput.inp.value = targetApp.js_file_path;
                clearanceInput.inp.value = targetApp.minimum_clearance;
                
                // Reverse lookup: Find which dropdown key matches the stored SVG
                const matchedIconKey = Object.keys(iconLibrary).find(k => iconLibrary[k] === targetApp.icon_path);
                if (matchedIconKey) {
                    iconSelect.value = matchedIconKey;
                    customIconInput.style.display = 'none';
                } else {
                    iconSelect.value = "Custom (Paste URL or SVG)";
                    customIconInput.value = targetApp.icon_path;
                    customIconInput.style.display = 'block';
                }
                updateIconPreview();
                submitBtn.innerText = 'Update Application';
                submitBtn.style.backgroundColor = '#10b981'; // Green for update
            }
        }
    };

    // --- Network Action ---
    submitBtn.onclick = async () => {
        const appName = appNameInput.inp.value.trim();
        const jsFilePath = jsPathInput.inp.value.trim();
        const isUpdate = modeSelect.value !== "NEW";
        
        let iconPath = iconSelect.value === "Custom (Paste URL or SVG)" 
            ? customIconInput.value.trim() 
            : iconLibrary[iconSelect.value];

        if (!appName || !iconPath || !jsFilePath) {
            statusMsg.style.color = '#ef4444'; statusMsg.innerText = 'Please fill out all fields.'; return;
        }

        submitBtn.innerText = isUpdate ? 'Updating...' : 'Registering...';
        const targetUrl = isUpdate ? `/api/system/apps/${encodeURIComponent(appName)}` : '/api/system/apps';
        const targetMethod = isUpdate ? 'PUT' : 'POST';
        
        try {
            const res = await fetch(targetUrl, {
                method: targetMethod,
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': activeUserId // Required Zero-Trust header
                },
                body: JSON.stringify({
                    userId: activeUserId,
                    appName,
                    iconPath,
                    jsFilePath,
                    minimumClearance: clearanceInput.inp.value
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                statusMsg.style.color = '#10b981';
                statusMsg.innerText = isUpdate ? 'Application updated! Refresh OS to view.' : 'Application registered! Refresh OS to view.';
                if (!isUpdate) {
                    appNameInput.inp.value = ''; customIconInput.value = ''; jsPathInput.inp.value = '../src/Universe/Me/galaxy/';
                }
            } else {
                throw new Error(data.error || 'Server rejected the request.');
            }
        } catch (err) {
            statusMsg.style.color = '#ef4444'; statusMsg.innerText = `Error: ${err.message}`;
        }
        
        submitBtn.innerText = isUpdate ? 'Update Application' : 'Register Module';
    };

    contentArea.appendChild(modeWrap);
    contentArea.appendChild(appNameInput.wrap);
    contentArea.appendChild(iconWrap);
    contentArea.appendChild(jsPathInput.wrap);
    contentArea.appendChild(clearanceInput.wrap);
    contentArea.appendChild(submitBtn);
    contentArea.appendChild(statusMsg);

    if (targetArea === appWindow) {
        appWindow.appendChild(contentArea);
        document.body.appendChild(appWindow);
    } else {
        targetArea.appendChild(contentArea);
    }
}