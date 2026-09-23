/**
 * ============================================================================
 * MODULE: /frontend/src/functions/t/top-bar.js
 * 
 * BACKEND EXCLUSIVE TOP BAR
 * Rendered ONLY when a user enters the Level-2 Backend Workspace.
 * ============================================================================
 */

export function initTopBar() {
    if (document.getElementById('tao-top-bar')) return;

    const barHeight = 44; 
    const edgePadding = 12; 

    const topBar = document.createElement('div');
    topBar.id = 'tao-top-bar';
    Object.assign(topBar.style, {
        position: 'fixed', top: '0px', left: '0', width: '100vw', 
        height: `${barHeight}px`, backgroundColor: '#ffffff', 
        borderBottom: '1px solid #e2e8f0', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', pointerEvents: 'auto', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${edgePadding}px`, boxSizing: 'border-box',
        zIndex: '20000' 
    });

    const leftCluster = document.createElement('div');
    Object.assign(leftCluster.style, { display: 'flex', alignItems: 'center', gap: '12px', flex: '1' });

    const chatboxBtn = document.createElement('button');
    chatboxBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    Object.assign(chatboxBtn.style, { background: 'none', border: 'none', cursor: 'pointer', width: '32px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' });

    chatboxBtn.onclick = () => { 
        if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX(); 
    };

    leftCluster.appendChild(chatboxBtn);

    const centerCluster = document.createElement('div');
    Object.assign(centerCluster.style, {
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '44px', height: '44px' 
    });

    const meOrb = document.createElement('img');
    meOrb.src = './src/functions/t/t-data/tao-yinyang-me.svg'; 
    Object.assign(meOrb.style, { 
        width: `32px`, height: `32px`, cursor: 'default', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', borderRadius: '50%' 
    });
    centerCluster.appendChild(meOrb);

    const rightCluster = document.createElement('div');
    Object.assign(rightCluster.style, { display: 'flex', alignItems: 'center', gap: '4px', flex: '1', justifyContent: 'flex-end' });

    const systemClock = document.createElement('div');
    Object.assign(systemClock.style, { color: '#0f172a', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold', paddingLeft: '8px' });
    
    const updateClock = () => {
        const now = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
        systemClock.innerText = now.toLocaleDateString('en-US', options).replace(',', '');
    };
    updateClock(); setInterval(updateClock, 60000);

    rightCluster.appendChild(systemClock);

    topBar.appendChild(leftCluster);
    topBar.appendChild(centerCluster);
    topBar.appendChild(rightCluster);
    
    // Attach strictly to the backend-workspace so it naturally hides during context switches
    const target = document.getElementById('backend-workspace') || document.body;
    target.appendChild(topBar);

    console.log('[System Chrome] Backend Top Bar successfully mounted.');
}