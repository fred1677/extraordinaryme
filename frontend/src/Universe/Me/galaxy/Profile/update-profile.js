/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/Profile/update-profile.js
 * 
 * DESCRIPTION:
 * The Central User Identity & Preferences Application.
 * Utilizes a smooth-scrolling tabbed interface inherited from the Health module.
 * Features Global Broadcasts to instantly update the user's Alias across 
 * all running OS applications, password management, and BYOS storage controls.
 * ============================================================================
 */

export const localDictionary = {
    name: "profile",
    commands: ["change name", "change password", "storage", "google drive", "aws", "local"]
};

// ============================================================================
// BLOCK 1: GENERAL (IDENTITY)
// ============================================================================
const createGeneralBlock = () => {
    const block = document.createElement('div');
    Object.assign(block.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        fontFamily: 'sans-serif', fontSize: '14px', color: '#0f172a', marginBottom: '24px'
    });

    block.innerHTML = `<strong style="font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">General Identity</strong>`;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' });

    const lbl = document.createElement('label');
    lbl.innerText = 'Display Name (Alias):';
    Object.assign(lbl.style, { color: '#475569', fontWeight: 'bold', fontSize: '13px' });

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    // Load current alias from local storage, fallback to default
    nameInput.value = localStorage.getItem('TAO_USER_ALIAS') || 'Admin';
    Object.assign(nameInput.style, {
        padding: '8px 12px', fontSize: '14px', border: '1px solid #cbd5e1', 
        borderRadius: '4px', outline: 'none'
    });

    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Update Alias';
    Object.assign(saveBtn.style, {
        backgroundColor: '#0ea5e9', color: '#ffffff', border: 'none', borderRadius: '4px', 
        padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
        alignSelf: 'flex-start', marginTop: '8px'
    });

    const statusMsg = document.createElement('span');
    Object.assign(statusMsg.style, { color: '#10b981', fontSize: '12px', fontStyle: 'italic', height: '16px' });

    saveBtn.onclick = () => {
        const newAlias = nameInput.value.trim();
        if (newAlias) {
            localStorage.setItem('TAO_USER_ALIAS', newAlias);
            
            // GLOBAL BROADCAST: Instantly tell Health.js and other apps to update the name
            window.dispatchEvent(new CustomEvent('tao-identity-updated', { detail: { alias: newAlias } }));
            
            statusMsg.innerText = 'Alias updated globally!';
            setTimeout(() => statusMsg.innerText = '', 3000);
        }
    };

    wrap.appendChild(lbl);
    wrap.appendChild(nameInput);
    wrap.appendChild(saveBtn);
    wrap.appendChild(statusMsg);
    block.appendChild(wrap);

    return block;
};

// ============================================================================
// BLOCK 2: SECURITY (PASSWORD)
// ============================================================================
const createSecurityBlock = () => {
    const block = document.createElement('div');
    Object.assign(block.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        fontFamily: 'sans-serif', fontSize: '14px', color: '#0f172a', marginBottom: '24px'
    });

    block.innerHTML = `<strong style="font-size: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Security</strong>`;

    const createPassField = (labelText) => {
        const wrap = document.createElement('div');
        Object.assign(wrap.style, { display: 'flex', flexDirection: 'column', gap: '4px', width: '300px' });
        
        const lbl = document.createElement('label');
        lbl.innerText = labelText;
        Object.assign(lbl.style, { color: '#475569', fontWeight: 'bold', fontSize: '13px' });
        
        const inp = document.createElement('input');
        inp.type = 'password';
        Object.assign(inp.style, { padding: '8px 12px', fontSize: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' });
        
        wrap.appendChild(lbl);
        wrap.appendChild(inp);
        return { wrap, inp };
    };

    const currentPass = createPassField('Current Password:');
    const newPass = createPassField('New Password:');
    const confirmPass = createPassField('Confirm New Password:');

    const saveBtn = document.createElement('button');
    saveBtn.innerText = 'Change Password';
    Object.assign(saveBtn.style, {
        backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', 
        padding: '8px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
        alignSelf: 'flex-start', marginTop: '8px'
    });

    saveBtn.onclick = () => {
        // Future Integration: Send to Postgres Auth Route
        console.log("Initiating password change sequence...");
        currentPass.inp.value = '';
        newPass.inp.value = '';
        confirmPass.inp.value = '';
        alert("Password change functionality will be wired to the secure backend router.");
    };

    block.appendChild(currentPass.wrap);
    block.appendChild(newPass.wrap);
    block.appendChild(confirmPass.wrap);
    block.appendChild(saveBtn);

    return block;
};

// ============================================================================
// BLOCK 3: STORAGE (BYOS, LOCAL & AWS CLOUD)
// ============================================================================
const createStorageBlock = () => {
    const block = document.createElement('div');
    Object.assign(block.style, {
        backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
        fontFamily: 'sans-serif', fontSize: '14px', color: '#0f172a', marginBottom: '24px'
    });

    block.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
            <strong style="font-size: 16px;">Storage Preferences</strong>
            <span style="font-size: 12px; color: #64748b; font-weight: bold;">Bring Your Own Storage (BYOS)</span>
        </div>
        <p style="color: #475569; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
            Select where TAO OS saves your heavy daily payloads. You can use our secure master cloud, connect your personal drive, or keep everything strictly on this physical device.
        </p>
    `;

    const storageOptions = [
        { id: 'aws', name: 'TAO OS Cloud (AWS S3)', desc: 'Default secure vault. 10 Megabytes included free tier.' },
        { id: 'gdrive', name: 'Google Drive', desc: 'Saves directly to a TAO OS folder in your personal Google account.' },
        { id: 'onedrive', name: 'Microsoft OneDrive', desc: 'Saves directly to your personal Microsoft account.' },
        { id: 'local', name: 'Local Device Storage', desc: 'Saves strictly to this device (Desktop/iPhone). Data will not sync to the cloud.' }
    ];

    // Load current preference (simulated)
    const currentPref = localStorage.getItem('TAO_STORAGE_PREF') || 'aws';

    storageOptions.forEach(opt => {
        const row = document.createElement('div');
        Object.assign(row.style, {
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
            border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff',
            cursor: 'pointer', transition: 'border-color 0.2s'
        });

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'storage_pref';
        radio.value = opt.id;
        radio.checked = (currentPref === opt.id);
        Object.assign(radio.style, { cursor: 'pointer', width: '16px', height: '16px' });

        const textWrap = document.createElement('div');
        textWrap.innerHTML = `
            <div style="font-weight: bold; color: #0f172a; margin-bottom: 2px;">${opt.name}</div>
            <div style="font-size: 12px; color: #64748b;">${opt.desc}</div>
        `;

        // Highlight selection
        if (radio.checked) row.style.borderColor = '#0ea5e9';

        row.onclick = () => {
            radio.checked = true;
            // Reset borders
            row.parentElement.querySelectorAll('div').forEach(d => {
                if(d.style.border) d.style.borderColor = '#cbd5e1';
            });
            row.style.borderColor = '#0ea5e9';
            
            localStorage.setItem('TAO_STORAGE_PREF', opt.id);

            if (opt.id === 'gdrive') {
                console.log("Triggering Google Drive OAuth Handshake...");
            } else if (opt.id === 'local') {
                console.log("Switching to offline Local Device Storage (IndexedDB/FileSystem).");
            }
        };

        row.prepend(radio);
        row.appendChild(textWrap);
        block.appendChild(row);
    });

    return block;
};

// ============================================================================
// MAIN APPLICATION INITIATOR (Mirrors Health.js architecture)
// ============================================================================
export async function initProfile(container) {
    const moduleName = "Settings & Profile"; 
    const safeId = "profile";
    
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
            position: 'fixed', top: '15%', left: '20%', width: '50vw', height: '65vh',
            minWidth: '360px', minHeight: '400px', backgroundColor: '#ffffff', 
            borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', 
            pointerEvents: 'auto', zIndex: '21000'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        targetArea = appWindow;
    }

    const appCanvas = document.createElement('div');
    Object.assign(appCanvas.style, {
        flex: '1', width: '100%', height: '100%', backgroundColor: '#ffffff',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '0' 
    });

    // ------------------------------------------------------------------------
    // TAB BAR NAVIGATION
    // ------------------------------------------------------------------------
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display: 'flex', gap: '24px', padding: '16px 32px 0 32px', borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff', flexShrink: '0', overflowX: 'auto', scrollbarWidth: 'none'
    });
    tabBar.innerHTML = `<style>#${safeId}-tabs::-webkit-scrollbar { display: none; }</style>`;
    tabBar.id = `${safeId}-tabs`;

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        flex: '1', padding: '24px 32px 48px 32px', overflowY: 'auto', minHeight: '0', height: '100%',
        scrollBehavior: 'smooth', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative'
    });

    const blocks = [];
    const tabs = [];
    const tabNames = ['General', 'Security', 'Storage'];

    blocks.push(createGeneralBlock());
    blocks.push(createSecurityBlock());
    blocks.push(createStorageBlock());

    blocks.forEach((block, index) => {
        contentArea.appendChild(block);
        
        const tab = document.createElement('div');
        tab.innerText = tabNames[index];
        Object.assign(tab.style, {
            padding: '12px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'sans-serif',
            color: index === 0 ? '#0284c7' : '#64748b', borderBottom: index === 0 ? '3px solid #0284c7' : '3px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.2s ease'
        });

        tab.onclick = () => {
            contentArea.scrollTo({ top: block.offsetTop - 24, behavior: 'smooth' });
            tabs.forEach(t => { t.style.color = '#64748b'; t.style.borderBottomColor = 'transparent'; });
            tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7';
        };
        tabs.push(tab);
        tabBar.appendChild(tab);
    });

    // Scroll Spy (Highlights tab as user scrolls)
    contentArea.addEventListener('scroll', () => {
        let currentBlock = 0;
        const scrollPos = contentArea.scrollTop;
        blocks.forEach((block, index) => { if (block.offsetTop - 60 <= scrollPos) currentBlock = index; });
        tabs.forEach((tab, index) => {
            if (index === currentBlock) { tab.style.color = '#0284c7'; tab.style.borderBottomColor = '#0284c7'; } 
            else { tab.style.color = '#64748b'; tab.style.borderBottomColor = 'transparent'; }
        });
    });

    appCanvas.appendChild(tabBar);
    appCanvas.appendChild(contentArea);
    targetArea.appendChild(appCanvas);
}