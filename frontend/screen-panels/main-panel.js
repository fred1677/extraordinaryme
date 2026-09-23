// File: /frontend/screen-panels/main-panel.js
import { renderChatbox } from '../components/chatbox.js';
import { speak } from '../components/voiceManager.js';

export function renderMainPanel(targetElement, options = { showChatbox: true }) {
    
    const universeName = (options.universeName || 'TAO').toUpperCase();
    
    let centerFontSize = 44; 
    if (universeName.length > 3) centerFontSize = 32;
    if (universeName.length > 5) centerFontSize = 24;
    if (universeName.length > 7) centerFontSize = 18;

    window.TAO_ENGINE = {
        bootMode: window.TAO_ENV || 'desktop',
        tourActive: false,
        activeUniverse: universeName,
        availableUniverses: options.universeArray || [{ name: 'TAO', is_immutable_home: true }],
        onAction: null, 
        
        toggleDrawer: function(drawerId) {
            const drawer = document.getElementById(drawerId);
            const overlay = document.getElementById('drawer-overlay');
            
            if (drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                overlay.classList.remove('active');
            } else {
                this.closeAll(); 
                drawer.classList.add('open');
                overlay.classList.add('active');
            }
            if(this.onAction) this.onAction('drawer_toggled', drawerId);
        },

        toggleSystemMenu: function() {
            const menu = document.getElementById('global-system-menu');
            const overlay = document.getElementById('drawer-overlay');
            
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                overlay.classList.remove('active');
            } else {
                this.closeAll();
                menu.classList.add('show');
                overlay.classList.add('active');
            }
            if(this.onAction) this.onAction('menu_toggled', 'system-menu');
        },
        
        toggleChatbox: function() {
            const cmdInterface = document.getElementById('global-command-interface');
            const cmdInputEl = document.getElementById('cmd-input');
            cmdInterface.classList.toggle('hidden');
            
            if (!cmdInterface.classList.contains('hidden')) {
                setTimeout(() => { cmdInputEl.focus(); }, 100);
            }
            if(this.onAction) this.onAction('chatbox_toggled', null);
        },

        closeAll: function() {
            document.getElementById('drawer-left').classList.remove('open');
            document.getElementById('drawer-right').classList.remove('open');
            document.getElementById('drawer-top').classList.remove('open');
            document.getElementById('global-system-menu').classList.remove('show');
            document.getElementById('drawer-overlay').classList.remove('active');
        }
    };

    targetElement.style.margin = '0';
    targetElement.style.height = '100dvh'; 
    targetElement.style.backgroundColor = '#0f172a';
    targetElement.style.display = 'flex';
    targetElement.style.flexDirection = 'column';
    targetElement.style.alignItems = 'center';
    targetElement.style.justifyContent = 'flex-start';
    targetElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    targetElement.style.overflow = 'hidden';

    const style = document.createElement('style');
    style.textContent = `
        .window-shell { display: flex; flex-direction: column; width: 100vw; height: 100dvh; overflow: hidden; box-sizing: border-box; background-color: #0f172a; position: relative; }
        .window-shell.mobile-simulator { max-width: 430px; margin: 0 auto; border-left: 1px solid #334155; border-right: 1px solid #334155; box-shadow: 0 0 40px rgba(0,0,0,0.8); }

        .universe-container { display: flex; justify-content: center; align-items: center; width: 100%; background-color: #1e293b; border-bottom: 1px solid #000000; position: relative; z-index: 300; box-shadow: 0 4px 15px rgba(0,0,0,0.6); flex-shrink: 0; }
        .universe-inner { position: relative; width: 100%; max-width: 900px; height: 65px; display: flex; justify-content: center; align-items: center; }
        .header-group-center { position: absolute; left: 50%; transform: translateX(-50%); display: flex; align-items: center; z-index: 10; }
        .header-group-left { position: absolute; left: var(--header-padding); display: flex; align-items: center; gap: var(--header-gap); }
        .header-group-right { position: absolute; right: var(--header-padding); display: flex; align-items: center; gap: var(--header-gap); }

        .header-orb { width: var(--orb-size); height: var(--orb-size); cursor: pointer; border-radius: 50%; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6), inset 0 -2px 4px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.1); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); flex-shrink: 0; }
        .header-orb:hover { transform: scale(1.15); }
        .header-orb svg { width: 100%; height: 100%; display: block; border-radius: 50%; }
        #tao-orb { width: var(--tao-size); height: var(--tao-size); }

        .header-icon-btn { background: none; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px; border-radius: 50%; transition: color 0.2s, background 0.2s, transform 0.2s; flex-shrink: 0; }
        .header-icon-btn:hover { color: #ffd700; background: rgba(255,255,255,0.05); transform: scale(1.1); }
        .header-icon-btn svg { width: var(--icon-size); height: var(--icon-size); }

        .system-menu-dropdown {
            position: absolute; top: calc(100% + 5px); left: var(--header-padding); background: #1e293b;
            border: 1px solid #334155; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            display: none; flex-direction: column; overflow: hidden; z-index: 250; min-width: 200px;
        }
        .system-menu-dropdown.show { display: flex; }
        .sys-menu-item { padding: 15px 20px; color: #e2e8f0; font-size: 14px; font-weight: 500; cursor: pointer; border-bottom: 1px solid #334155; transition: background 0.2s; }
        .sys-menu-item:last-child { border-bottom: none; }
        .sys-menu-item:hover { background: #334155; color: #ffd700; }

        .app-body { position: relative; flex-grow: 1; width: 100%; display: flex; justify-content: center; }
        .main-view-column { flex-grow: 1; width: 100%; max-width: 900px; padding: 30px 15px 175px 15px; box-sizing: border-box; overflow-y: auto; position: relative; z-index: 10; color: #e2e8f0; }

        @media (min-width: 768px) { .universe-inner { height: 80px; } .main-view-column { padding: 30px 40px 175px 40px; } }

        .drawer-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 190; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
        .drawer-overlay.active { opacity: 1; pointer-events: auto; }
        .drawer-wrapper { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 900px; height: 100%; pointer-events: none; overflow: hidden; z-index: 200; }
        .drawer { position: absolute; background: #0f172a; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.05); box-shadow: 0 0 35px rgba(0,0,0,0.9); padding: 30px; box-sizing: border-box; overflow-y: auto; color: #fff; pointer-events: auto; }
        .drawer-left { top: 0; left: 0; width: 85%; max-width: 350px; height: 100%; transform: translateX(-100%); border-right: 1px solid #334155; }
        .drawer-right { top: 0; right: 0; width: 85%; max-width: 350px; height: 100%; transform: translateX(100%); border-left: 1px solid #334155; }
        .drawer-top { top: 0; left: 0; width: 100%; height: 75%; max-height: 500px; transform: translateY(-100%); border-bottom: 1px solid #334155; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; }
        .drawer.open { transform: translate(0, 0); }
    `;
    document.head.appendChild(style);

    const shell = document.createElement('div');
    shell.className = 'window-shell';

    if (window.TAO_ENV === 'mobile' && window.innerWidth > 768) {
        shell.classList.add('mobile-simulator');
    }

    const container = document.createElement('div');
    container.className = 'universe-container';

    container.innerHTML = `
        <div class="universe-inner">
            <div class="header-group-left">
                <div class="header-orb" id="left-orb" title="Messaging Module">
                    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#ffffff" /><text x="50" y="50" dy="0.32em" font-family="monospace" font-size="28" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="-1">LEFT</text></svg>
                </div>
                <button class="header-icon-btn" id="header-menu-btn" title="System Menu">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div class="header-orb" id="help-orb">
                    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#10b981" /><text x="50" y="50" dy="0.35em" font-family="monospace" font-size="55" font-weight="900" fill="#ffffff" text-anchor="middle">?</text></svg>
                </div>
            </div>
            
            <div class="header-group-center">
                <div class="header-orb" id="tao-orb" title="Dashboard">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="50" fill="#ffd700" />
                        <text x="50" y="50" dy="0.32em" font-family="monospace" font-size="${centerFontSize}" font-weight="900" fill="#000000" text-anchor="middle" letter-spacing="-1">${universeName}</text>
                    </svg>
                </div>
            </div>
            
            <div class="header-group-right">
                <button class="header-icon-btn" id="header-mic-btn" title="Voice to Text">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
                <button class="header-icon-btn" id="header-voice-chat-btn" title="Live Voice Chat" style="color: #4ade80;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6 c2 -2.5, 4 -2.5, 6 0 s 4 2.5, 6 0 s 4 -2.5, 6 0" /><path d="M3 12 c2 -2.5, 4 -2.5, 6 0 s 4 2.5, 6 0 s 4 -2.5, 6 0" /><path d="M3 18 c2 -2.5, 4 -2.5, 6 0 s 4 2.5, 6 0 s 4 -2.5, 6 0" /></svg>
                </button>
                <div class="header-orb" id="logoff-orb">
                    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#dc2626" /><text x="50" y="50" dy="0.32em" font-family="monospace" font-size="30" font-weight="900" fill="#ffffff" text-anchor="middle">OFF</text></svg>
                </div>
                <div class="header-orb" id="right-orb" title="Health Module">
                    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#000000" /><text x="50" y="50" dy="0.32em" font-family="monospace" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">RIGHT</text></svg>
                </div>
            </div>
        </div>
    `;
    shell.appendChild(container);

    const systemMenu = document.createElement('div');
    systemMenu.className = 'system-menu-dropdown';
    systemMenu.id = 'global-system-menu';
    systemMenu.innerHTML = `
        <div class="sys-menu-item">Open Messaging (messaging.html)</div>
        <div class="sys-menu-item">Open Health (health.html)</div>
        <div class="sys-menu-item" style="color: #64748b;">System Configuration</div>
    `;
    container.querySelector('.universe-inner').appendChild(systemMenu);

    const appBody = document.createElement('div');
    appBody.className = 'app-body';
    
    const mainView = document.createElement('div');
    mainView.className = 'main-view-column';
    mainView.id = 'main-canvas';
    mainView.innerHTML = `<div style="text-align: center; color: #475569; margin-top: 50px;">Main Canvas Area</div>`;
    appBody.appendChild(mainView);

    const drawerWrapper = document.createElement('div');
    drawerWrapper.className = 'drawer-wrapper';
    drawerWrapper.innerHTML = `
        <div class="drawer drawer-left" id="drawer-left">
            <h2 style="color: #60a5fa; margin-top: 0;">Communications</h2>
            <p style="color: #94a3b8; font-size: 14px;">Messaging modules will load here.</p>
        </div>
        <div class="drawer drawer-right" id="drawer-right">
            <h2 style="color: #f472b6; margin-top: 0;">Health Tracking</h2>
            <p style="color: #94a3b8; font-size: 14px;">Health data visualizations will load here.</p>
        </div>
        <div class="drawer drawer-top" id="drawer-top">
            <h2 style="color: #ffd700; margin-top: 0;">System Menu</h2>
            <p style="color: #94a3b8; font-size: 14px;">TAO global routing dashboard.</p>
        </div>
    `;
    appBody.appendChild(drawerWrapper);
    shell.appendChild(appBody);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawer-overlay';
    shell.appendChild(overlay);

    targetElement.appendChild(shell);

    renderChatbox(shell, options);
    
    const cmdInput = document.getElementById('cmd-input');
    const taoText = document.getElementById('tao-text');
    
    if (cmdInput && taoText) {
        cmdInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); 
                const message = cmdInput.value.trim();
                if (!message) return;
                
                cmdInput.value = ''; 
                taoText.innerHTML = `<span style="color:#94a3b8;">You: ${message}</span><br><span style="color:#10b981;">TAO is processing...</span>`;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    
                    const data = await response.json();
                    const taoReply = data.reply || data.response || "Message received.";
                    
                    taoText.innerHTML = `<span style="color:#94a3b8;">You: ${message}</span><br><span style="color:#e2e8f0;">TAO: ${taoReply}</span>`;
                    speak(taoReply); 
                } catch (err) {
                    console.error("Chat API Error:", err);
                    taoText.innerHTML = `<span style="color:#dc2626;">TAO: Connection to the absolute void failed.</span>`;
                }
            }
        });
    }

    document.getElementById('drawer-overlay').addEventListener('click', () => window.TAO_ENGINE.closeAll());
    document.getElementById('left-orb').addEventListener('click', () => window.TAO_ENGINE.toggleDrawer('drawer-left'));
    document.getElementById('right-orb').addEventListener('click', () => window.TAO_ENGINE.toggleDrawer('drawer-right'));
    document.getElementById('header-menu-btn').addEventListener('click', () => window.TAO_ENGINE.toggleSystemMenu());

    let orbClickTimer = null;
    document.getElementById('tao-orb').addEventListener('click', () => {
        if (orbClickTimer) {
            clearTimeout(orbClickTimer);
            orbClickTimer = null;
            window.TAO_ENGINE.toggleChatbox();
        } else {
            orbClickTimer = setTimeout(() => {
                orbClickTimer = null;
                window.TAO_ENGINE.toggleDrawer('drawer-top');
            }, 250); 
        }
    });

    document.getElementById('help-orb').addEventListener('click', async () => {
        if (window.TAO_ENGINE.tourActive) return; 
        try {
            const { renderHelp } = await import('../help/help-main.js');
            renderHelp();
        } catch (err) {
            console.error('Failed to load help module:', err);
        }
    });

    // --- THE LOGOFF PATCH ---
    document.getElementById('logoff-orb').addEventListener('click', () => {
        
        // Scenario A: Tour is active. Hitting OFF simply aborts the tour safely.
        if (window.TAO_ENGINE.tourActive) {
            if(window.TAO_ENGINE.onAction) window.TAO_ENGINE.onAction('end_tour', 'logoff-orb');
            return; 
        }

        // Scenario B: Tour is NOT active. Perform a true system logoff.
        if(window.TAO_ENGINE.onAction) window.TAO_ENGINE.onAction('logoff', null);
        localStorage.removeItem('tao_user_id'); // Clear the session token
        delete window.TAO_ENV;
        window.location.href = '/'; // Redirects you perfectly to the Login view
    });
    // -------------------------
}
