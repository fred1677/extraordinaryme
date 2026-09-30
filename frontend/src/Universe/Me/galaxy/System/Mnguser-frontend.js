/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/galaxy/System/Mnguser-frontend.js
 * 
 * DESCRIPTION:
 * OS User Administration UI. Handles account creation, OS clearance upgrades, 
 * and password resets. Operates strictly in the public User Mode hierarchy.
 * Features a high-density, real-time searchable datagrid.
 * ============================================================================
 */

export async function initUserManager(container) {
    const moduleName = "User Manager"; 
    const safeId = "user-manager";
    
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
            position: 'fixed', top: '10%', left: '15%', width: '850px', height: '70vh',
            backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', 
            pointerEvents: 'auto', zIndex: '21000'
        });

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        targetArea = appWindow;
    }

    const activeUserId = localStorage.getItem('TAO_SESSION_TOKEN');
    let globalUsersList = []; // In-memory cache for instant searching

    const appCanvas = document.createElement('div');
    Object.assign(appCanvas.style, {
        flex: '1', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc',
        fontFamily: 'sans-serif', color: '#0f172a', overflow: 'hidden'
    });

    // --- Tab Navigation ---
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display: 'flex', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', flexShrink: '0'
    });

    const createTab = (text, isActive) => {
        const t = document.createElement('div');
        t.innerText = text;
        Object.assign(t.style, {
            padding: '12px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
            color: isActive ? '#0ea5e9' : '#64748b', borderBottom: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
            transition: 'all 0.2s'
        });
        return t;
    };

    const dirTab = createTab('Directory', true);
    const newTab = createTab('Provision New User', false);
    tabBar.appendChild(dirTab);
    tabBar.appendChild(newTab);

    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, { 
        flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' 
    });

    // ========================================================================
    // VIEW 1: HIGH-DENSITY USER DIRECTORY
    // ========================================================================
    const dirView = document.createElement('div');
    Object.assign(dirView.style, { 
        display: 'flex', flexDirection: 'column', flex: '1', overflow: 'hidden' 
    });

    // Search Bar Area (Sticky Top)
    const searchArea = document.createElement('div');
    Object.assign(searchArea.style, {
        padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: '12px', flexShrink: '0'
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Type to search by username or email...';
    Object.assign(searchInput.style, {
        flex: '1', padding: '10px 14px', fontSize: '13px', border: '1px solid #cbd5e1', 
        borderRadius: '6px', outline: 'none', backgroundColor: '#f1f5f9'
    });

    const searchCount = document.createElement('div');
    Object.assign(searchCount.style, { fontSize: '12px', color: '#64748b', fontWeight: 'bold', minWidth: '80px', textAlign: 'right' });

    searchArea.appendChild(searchInput);
    searchArea.appendChild(searchCount);

    // Scrollable List Area
    const listContainer = document.createElement('div');
    Object.assign(listContainer.style, {
        flex: '1', overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column'
    });

    // Real-time filtering engine
    const triggerSearch = () => {
        const term = searchInput.value.toLowerCase().trim();
        const filtered = globalUsersList.filter(u => 
            u.username.toLowerCase().includes(term) || 
            u.email.toLowerCase().includes(term)
        );
        renderUsers(filtered);
    };

    searchInput.addEventListener('input', triggerSearch);

    // The Renderer (1 line per user)
    const renderUsers = (usersToRender) => {
        listContainer.innerHTML = '';
        searchCount.innerText = `${usersToRender.length} Users`;

        if (usersToRender.length === 0) {
            listContainer.innerHTML = '<div style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">No users found matching that search.</div>';
            return;
        }

        usersToRender.forEach((user, index) => {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                borderBottom: '1px solid #e2e8f0', gap: '16px'
            });

            // Column 1: Identity
            const identityCol = document.createElement('div');
            Object.assign(identityCol.style, { flex: '1.5', minWidth: '150px', display: 'flex', flexDirection: 'column' });
            identityCol.innerHTML = `
                <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${user.username}</div>
                <div style="font-size: 11px; color: #64748b;">${user.email}</div>
            `;

            // Column 2: Designation Update
            const desigCol = document.createElement('div');
            Object.assign(desigCol.style, { flex: '1', display: 'flex', alignItems: 'center', gap: '6px' });
            
            const desigSelect = document.createElement('select');
            ['Explorer', 'System', 'Godmode'].forEach(opt => {
                const el = document.createElement('option');
                el.value = opt; el.innerText = opt;
                if (user.designation === opt) el.selected = true;
                desigSelect.appendChild(el);
            });
            Object.assign(desigSelect.style, { padding: '4px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px' });

            const updateDesigBtn = document.createElement('button');
            updateDesigBtn.innerText = 'Save';
            Object.assign(updateDesigBtn.style, { padding: '4px 8px', fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });
            
            updateDesigBtn.onclick = async () => {
                updateDesigBtn.innerText = '...';
                await fetch(`/api/users/${user.id}/clearance`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requesterId: activeUserId, designation: desigSelect.value })
                });
                updateDesigBtn.innerText = 'Save';
                // Silently refresh global list to keep cache accurate
                loadUsers(true); 
            };
            desigCol.appendChild(desigSelect);
            desigCol.appendChild(updateDesigBtn);

            // Column 3: Password Reset
            const passCol = document.createElement('div');
            Object.assign(passCol.style, { flex: '1.5', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' });

            const passInput = document.createElement('input');
            passInput.type = 'text';
            passInput.placeholder = 'New Password';
            Object.assign(passInput.style, { padding: '4px 8px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100px' });

            const reqChangeWrap = document.createElement('label');
            Object.assign(reqChangeWrap.style, { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b' });
            const reqChangeBox = document.createElement('input');
            reqChangeBox.type = 'checkbox';
            reqChangeBox.checked = true;
            reqChangeWrap.appendChild(reqChangeBox);
            reqChangeWrap.appendChild(document.createTextNode('Force'));

            const updatePassBtn = document.createElement('button');
            updatePassBtn.innerText = 'Reset';
            Object.assign(updatePassBtn.style, { padding: '4px 10px', fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' });

            updatePassBtn.onclick = async () => {
                if (!passInput.value) return alert('Enter a temporary password.');
                updatePassBtn.innerText = '...';
                await fetch(`/api/users/${user.id}/password`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requesterId: activeUserId, newPassword: passInput.value, requirePassChange: reqChangeBox.checked })
                });
                updatePassBtn.innerText = 'Reset';
                passInput.value = '';
            };

            passCol.appendChild(passInput);
            passCol.appendChild(reqChangeWrap);
            passCol.appendChild(updatePassBtn);

            row.appendChild(identityCol);
            row.appendChild(desigCol);
            row.appendChild(passCol);
            listContainer.appendChild(row);
        });
    };

    // Network Fetcher
    const loadUsers = async (isSilentRefresh = false) => {
        if (!isSilentRefresh) {
            listContainer.innerHTML = '<div style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">Loading OS registry...</div>';
            searchCount.innerText = 'Loading...';
        }
        try {
            const res = await fetch(`/api/users?requesterId=${activeUserId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            globalUsersList = data.users;
            triggerSearch(); // Re-apply any active search filter
        } catch (err) {
            listContainer.innerHTML = `<div style="color: #ef4444; font-size: 13px; text-align: center; margin-top: 20px;">Error: ${err.message}</div>`;
        }
    };

    dirView.appendChild(searchArea);
    dirView.appendChild(listContainer);

    // ========================================================================
    // VIEW 2: PROVISION NEW USER
    // ========================================================================
    const newView = document.createElement('div');
    Object.assign(newView.style, { display: 'none', flexDirection: 'column', gap: '16px', maxWidth: '400px', padding: '24px' });

    const createInput = (lblTxt, type = 'text') => {
        const w = document.createElement('div');
        w.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
        const l = document.createElement('label');
        l.innerText = lblTxt;
        l.style.cssText = 'font-weight: bold; font-size: 12px; color: #475569;';
        const i = document.createElement('input');
        i.type = type;
        i.style.cssText = 'padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; outline: none; background: #ffffff;';
        w.appendChild(l); w.appendChild(i);
        return { wrap: w, input: i };
    };

    const nUser = createInput('Username');
    const nEmail = createInput('Email', 'email');
    const nPass = createInput('Initial Password', 'password');
    
    const desigWrap = document.createElement('div');
    desigWrap.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';
    desigWrap.innerHTML = '<label style="font-weight: bold; font-size: 12px; color: #475569;">OS Clearance</label>';
    const nDesig = document.createElement('select');
    nDesig.style.cssText = 'padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: #ffffff;';
    ['Explorer', 'System', 'Godmode'].forEach(opt => nDesig.innerHTML += `<option value="${opt}">${opt}</option>`);
    desigWrap.appendChild(nDesig);

    const forceChangeWrap = document.createElement('label');
    forceChangeWrap.style.cssText = 'display: flex; alignItems: center; gap: 8px; font-size: 13px; color: #0f172a; margin-top: 8px;';
    const nForce = document.createElement('input');
    nForce.type = 'checkbox';
    nForce.checked = true;
    forceChangeWrap.appendChild(nForce);
    forceChangeWrap.appendChild(document.createTextNode('Require user to change password on first login'));

    const createBtn = document.createElement('button');
    createBtn.innerText = 'Provision Account';
    Object.assign(createBtn.style, {
        padding: '10px 16px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none',
        borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px'
    });

    const formMsg = document.createElement('div');
    formMsg.style.cssText = 'font-size: 12px; font-weight: bold;';

    createBtn.onclick = async () => {
        if (!nUser.input.value || !nEmail.input.value || !nPass.input.value) {
            formMsg.style.color = '#ef4444';
            return formMsg.innerText = 'All fields are required.';
        }
        createBtn.innerText = 'Creating...';
        try {
            const res = await fetch('/api/users', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requesterId: activeUserId,
                    username: nUser.input.value, email: nEmail.input.value,
                    password: nPass.input.value, designation: nDesig.value,
                    requirePassChange: nForce.checked
                })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            formMsg.style.color = '#10b981';
            formMsg.innerText = 'User provisioned successfully.';
            nUser.input.value = ''; nEmail.input.value = ''; nPass.input.value = '';
            
            loadUsers(true);
        } catch (err) {
            formMsg.style.color = '#ef4444';
            formMsg.innerText = `Error: ${err.message}`;
        }
        createBtn.innerText = 'Provision Account';
    };

    newView.appendChild(nUser.wrap);
    newView.appendChild(nEmail.wrap);
    newView.appendChild(nPass.wrap);
    newView.appendChild(desigWrap);
    newView.appendChild(forceChangeWrap);
    newView.appendChild(createBtn);
    newView.appendChild(formMsg);

    // --- Tab Switching Logic ---
    dirTab.onclick = () => {
        dirTab.style.color = '#0ea5e9'; dirTab.style.borderBottomColor = '#0ea5e9';
        newTab.style.color = '#64748b'; newTab.style.borderBottomColor = 'transparent';
        dirView.style.display = 'flex'; newView.style.display = 'none';
        
        if (globalUsersList.length === 0) loadUsers(); // Only hard-load if cache is empty
    };
    newTab.onclick = () => {
        newTab.style.color = '#0ea5e9'; newTab.style.borderBottomColor = '#0ea5e9';
        dirTab.style.color = '#64748b'; dirTab.style.borderBottomColor = 'transparent';
        newView.style.display = 'flex'; dirView.style.display = 'none';
        formMsg.innerText = '';
    };

    contentArea.appendChild(dirView);
    contentArea.appendChild(newView);
    appCanvas.appendChild(tabBar);
    appCanvas.appendChild(contentArea);

    if (targetArea === appWindow) {
        appWindow.appendChild(appCanvas);
        document.body.appendChild(appWindow);
    } else {
        targetArea.appendChild(appCanvas);
    }

    // Initial load
    loadUsers();
}