/**
 * ============================================================================
 * MODULE: /frontend/index.js
 * 
 * MASTER BOOTLOADER ARCHITECTURE (TAO OS) - LIVE PRODUCTION
 * 
 * ============================================================================
 * LAYPERSON EXPLANATION: THE "DUAL SESSION" ARCHITECTURE
 * 
 * Think of this OS as a building with two completely separate rooms:
 * 1. The Public Room (#user-workspace): Where everyday users open apps.
 * 2. The Secret Admin Room (#backend-workspace): Where the Taouser manages the system.
 * 
 * Instead of closing apps when switching modes, we just turn off the lights 
 * in one room and turn them on in the other. This preserves all open apps, 
 * windows, and workflows exactly as you left them!
 * ============================================================================
 */

const log = (step, msg, data) => {
    console.log(`[${step}] ${msg}`, data ? data : '');
};

async function bootSystem() {
    log("SYSTEM", "Live Production Boot sequence initialized.");

    const preloader = document.getElementById('sandbox-console');
    if (preloader) preloader.remove();

    // ========================================================================
    // SECTION 1: HARDWARE, ENVIRONMENT & THE "TWO ROOMS"
    // ========================================================================
    let platform = 'Desktop';
    let hostOS = 'Unknown OS';

    try {
        Object.assign(document.body.style, { overflow: 'hidden', touchAction: 'none', userSelect: 'none', webkitUserSelect: 'none' });
        
        const masterRoot = document.createElement('div');
        masterRoot.id = 'tao-os-root';
        Object.assign(masterRoot.style, { 
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', 
            pointerEvents: 'none', zIndex: '0' 
        });
        document.body.appendChild(masterRoot);

        const userWorkspace = document.createElement('div');
        userWorkspace.id = 'user-workspace';
        Object.assign(userWorkspace.style, { 
            position: 'absolute', inset: '0', width: '100%', height: '100%', 
            pointerEvents: 'none', display: 'block' 
        });
        masterRoot.appendChild(userWorkspace);

        const backendWorkspace = document.createElement('div');
        backendWorkspace.id = 'backend-workspace';
        Object.assign(backendWorkspace.style, { 
            position: 'absolute', inset: '0', width: '100%', height: '100%', 
            pointerEvents: 'none', display: 'none' 
        });
        masterRoot.appendChild(backendWorkspace);

        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        platform = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ? 'Mobile' : 'Desktop';
        
        if (/iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
            hostOS = "iOS"; platform = "Mobile";
        } else if (/Android/i.test(userAgent)) {
            hostOS = "Android"; platform = "Mobile";
        } else if (userAgent.indexOf("Mac") !== -1) {
            hostOS = "macOS";
        } else if (userAgent.indexOf("Win") !== -1) {
            hostOS = "Windows";
        }

        let nativeLang = navigator.language || navigator.userLanguage || "en-US";
        let availableLangsArray = navigator.languages || [nativeLang];
        
        window.TAO_HARDWARE_CACHE = { platform, hostOS, nativeLang, availableLangs: availableLangsArray };
        window.TAO_HARDWARE_CACHE.geometry = { width: window.innerWidth, height: window.innerHeight, pixelRatio: window.devicePixelRatio || 1 };
        
        log("STEP 1", `Hardware mapped. [Platform: ${platform}] [OS: ${hostOS}]`);
    } catch (e) { 
        log("ERROR", "Hardware map failed."); 
        return; 
    }

    // ========================================================================
    // SECTION 2: THE SECURITY GATEWAY
    // ========================================================================
    let authState = { auth: false, userId: null, username: null, isNewAccount: false, designation: 'Explorer', paidTier: 'no' };
    
    try {
        log("STEP 2", "Routing to Security Gateway (login.js)...");
        const { initLogin } = await import('./components/login.js');
        authState = await initLogin();
        
        if (authState.userId) {
            localStorage.setItem('TAO_SESSION_TOKEN', authState.userId);
        }
        log("SYSTEM", `Authenticated: [${authState.username || 'Unknown'}] [Designation: ${authState.designation}]`);
    } catch (e) {
        log("ERROR", "Failed to resolve login.js.", e.message);
        return; 
    }

    window.TAO_USER_CONFIG = window.TAO_USER_CONFIG || {};
    window.TAO_USER_CONFIG.designation = authState.designation || 'Explorer';
    window.TAO_USER_CONFIG.username = authState.username || 'Unknown';
    window.TAO_USER_CONFIG.paidTier = (authState.designation === 'System' || authState.paidTier === true || authState.paidTier === 'yes') ? 'yes' : 'no';

    // ========================================================================
    // SECTION 3: CORE ENGINE INITIALIZATION
    // ========================================================================
    window.TAO_CORE = window.TAO_CORE || {};
    window.TAO_ENGINE = window.TAO_ENGINE || {};

    window.TAO_ENGINE.LAYERS = {
        USER: 'user-workspace',       
        BACKEND: 'backend-workspace', 
        GLOBAL: 'tao-os-root'         
    };

    try {
        const { igniteEdgeAI } = await import('./libs/ai/ai-hub.js');
        await igniteEdgeAI();
    } catch (e) {
        log("ERROR", "Failed to wire Edge AI modules.", e.message);
    }

    try {
        const { initWindowManager } = await import('./components/windowmanager.js');
        initWindowManager();
        
        const { initTopBottomBar } = await import('./src/functions/t/top-bottom-bar.js');
        initTopBottomBar();
        log("SYSTEM", "System Chrome (Bottom Dock) Successfully bound.");
    } catch (e) {
        log("ERROR", "Failed to construct Window Physics or System Chrome", e.message);
    }

    // ========================================================================
    // SECTION 4: WORKSPACE ROUTING (Populating the Public Room)
    // ========================================================================
    try {
        const { initHomeScreen } = await import('./screen-panels/home-screen.js');
        await initHomeScreen();
        log("SYSTEM", "Home screen successfully rendered inside Public Workspace.");
    } catch (e) {
        log("ERROR", "Failed to hydrate Public Workspace.", e.message);
    }

    // ========================================================================
    // SECTION 5: THE GLOBAL CHATBOX (The Transcendent Router)
    // ========================================================================
    try {
        const root = document.getElementById('tao-os-root') || document.body;
        
        const chatWindow = document.createElement('div');
        chatWindow.id = 'tao-chatbox-window';
        chatWindow.classList.add('tao-system-window', 'tao-window', 'is-floating', 'is-minimized'); 
        chatWindow.dataset.physicsEnforced = 'true'; 

        Object.assign(chatWindow.style, {
            position: 'fixed', bottom: '100px', right: '24px', width: '320px', height: '260px',
            backgroundColor: '#0f172a', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden', display: 'none', flexDirection: 'column', pointerEvents: 'auto', zIndex: '60000' 
        });

        const contentArea = document.createElement('div');
        Object.assign(contentArea.style, { flex: '1', overflow: 'hidden', position: 'relative' });
        chatWindow.appendChild(contentArea);
        root.appendChild(chatWindow);

        let isVoiceActive = false;

        setTimeout(async () => {
            const header = document.createElement('div');
            header.className = 'tao-window-header'; 
            Object.assign(header.style, {
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
                userSelect: 'none', cursor: 'grab', flexShrink: '0'
            });

            // Traffic Lights
            const trafficLights = document.createElement('div');
            Object.assign(trafficLights.style, { display: 'flex', gap: '8px', width: '60px' }); 
            
            const closeBtn = document.createElement('div');
            Object.assign(closeBtn.style, { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', cursor: 'pointer' });
            closeBtn.onclick = (e) => { e.stopPropagation(); window.TAO_TOGGLE_CHATBOX(); }; 
            
            const minBtn = document.createElement('div');
            Object.assign(minBtn.style, { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308', cursor: 'pointer' });
            minBtn.onclick = (e) => {
                e.stopPropagation();
                isVoiceActive = false;
                const svg = document.getElementById('tao-voice-svg');
                if (svg) svg.style.stroke = '#a8c7fa';
                window.dispatchEvent(new CustomEvent('tao-chatbox-closed')); 

                chatWindow.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                chatWindow.style.transform = 'translateY(80vh) scale(0.2)'; 
                chatWindow.style.opacity = '0';
                
                setTimeout(() => { 
                    chatWindow.style.display = 'none'; 
                    chatWindow.classList.add('is-minimized'); 
                    chatWindow.style.transform = 'none'; 
                    chatWindow.style.opacity = '1'; 
                    document.dispatchEvent(new CustomEvent('tao-window-docked', {
                        detail: { winElement: chatWindow, title: 'Chatbox' }
                    }));
                }, 400); 
            };
            
            const maxBtn = document.createElement('div');
            Object.assign(maxBtn.style, { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e', cursor: 'pointer' });
            maxBtn.onclick = (e) => {
                e.stopPropagation();
                chatWindow.style.transition = 'all 0.3s ease';
                
                if (chatWindow.classList.contains('is-maximized')) {
                    chatWindow.classList.remove('is-maximized');
                    chatWindow.style.width = '320px'; chatWindow.style.height = '260px';
                    chatWindow.style.bottom = '100px'; chatWindow.style.right = '24px';
                    chatWindow.style.top = 'auto'; chatWindow.style.left = 'auto'; 
                    chatWindow.style.borderRadius = '12px'; header.style.cursor = 'grab';
                } else {
                    chatWindow.classList.add('is-maximized');
                    const bounds = window.TAO_ENGINE?.getWorkspaceBounds ? window.TAO_ENGINE.getWorkspaceBounds() : { top: 44, bottom: 44 };
                    chatWindow.style.width = '100vw'; chatWindow.style.height = `calc(100vh - ${bounds.top + bounds.bottom}px)`;
                    chatWindow.style.top = `${bounds.top}px`; chatWindow.style.left = '0px';
                    chatWindow.style.bottom = 'auto'; chatWindow.style.right = 'auto'; 
                    chatWindow.style.borderRadius = '0px'; header.style.cursor = 'default';
                }
                setTimeout(() => chatWindow.style.transition = 'none', 300); 
            };
            
            trafficLights.append(closeBtn, minBtn, maxBtn);

            // ==========================================
            // CENTER ZONE: DYNAMIC HAMBURGER MENU
            // ==========================================
            const centerZone = document.createElement('div');
            Object.assign(centerZone.style, { display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' });
            
            const hamburgerBtn = document.createElement('div');
            hamburgerBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            Object.assign(hamburgerBtn.style, { cursor: 'pointer', display: 'flex', alignItems: 'center' });

            const dropdown = document.createElement('div');
            Object.assign(dropdown.style, {
                display: 'none', position: 'absolute', top: '26px', left: '-10px',
                backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.6)', width: '150px',
                flexDirection: 'column', overflow: 'hidden', zIndex: '65000'
            });

            // 🚀 The Dynamic Menu Builder Function
            const populateMenu = () => {
                dropdown.innerHTML = ''; // Clear previous items

                const currentMode = window.TAO_ENGINE?.getWorkspaceBounds?.().mode || 'standard';
                const designation = window.TAO_USER_CONFIG?.designation || 'Explorer';
                const isTaoUser = designation === 'System' || designation === 'Godmode';

                const menuOptions = [];

                // 🚀 DYNAMIC TOGGLE: Only injected if user has backend clearance
                if (isTaoUser) {
                    if (currentMode === 'backend') {
                        menuOptions.push({
                            label: 'Enter User Mode',
                            isToggle: true,
                            action: async () => {
                                console.log('[System Router] Transitioning to User Mode via menu...');
                                try {
                                    const { initHomeScreen } = await import('./screen-panels/home-screen.js?v=' + new Date().getTime());
                                    await initHomeScreen();
                                } catch (err) {}
                            }
                        });
                    } else {
                        menuOptions.push({
                            label: 'Enter Tao Mode',
                            isToggle: true,
                            action: async () => {
                                console.log('[System Router] Initiating Level-2 Security via menu...');
                                if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
                                try {
                                    const { initTaoLogin } = await import('./components/tao-login.js?v=' + new Date().getTime());
                                    await initTaoLogin();
                                } catch (err) {}
                            }
                        });
                    }
                    // Add a visual divider after the toggle option
                    menuOptions.push({ isDivider: true });
                }

                // Standard Power Options
                menuOptions.push(
                    { label: 'Sleep', action: () => { 
                        const sleepScreen = document.createElement('div');
                        Object.assign(sleepScreen.style, {
                            position: 'fixed', inset: '0', backgroundColor: '#000000', zIndex: '99999', cursor: 'pointer'
                        });
                        sleepScreen.onclick = () => sleepScreen.remove();
                        document.body.appendChild(sleepScreen);
                    }},
                    { label: 'Sign Out', action: () => { 
                        localStorage.setItem('TAO_RESTORE_SESSION', 'true'); 
                        localStorage.removeItem('TAO_SESSION_TOKEN'); 
                        window.location.reload(); 
                    }},
                    { label: 'Restart', action: () => {
                        localStorage.removeItem('TAO_RESTORE_SESSION');
                        localStorage.removeItem('TAO_SESSION_TOKEN');
                        window.location.reload();
                    }},
                    { label: 'Shut Down', action: () => {
                        document.body.innerHTML = '';
                        document.body.style.backgroundColor = '#000000';
                    }}
                );

                // Render the array into actual HTML elements
                menuOptions.forEach(opt => {
                    if (opt.isDivider) {
                        const divider = document.createElement('div');
                        Object.assign(divider.style, { height: '1px', backgroundColor: '#334155', margin: '2px 0' });
                        dropdown.appendChild(divider);
                        return;
                    }

                    const item = document.createElement('div');
                    item.innerText = opt.label;
                    Object.assign(item.style, {
                        padding: '10px 14px', color: '#f8fafc', fontSize: '13px', 
                        fontFamily: 'sans-serif', cursor: 'pointer', letterSpacing: '0.3px',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    });
                    
                    // Highlight the Mode Toggle button in TAO Blue
                    if (opt.isToggle) {
                        item.style.color = '#38bdf8'; 
                        item.style.fontWeight = 'bold';
                    }

                    item.onmouseover = () => item.style.backgroundColor = '#334155';
                    item.onmouseout = () => item.style.backgroundColor = 'transparent';
                    
                    item.onclick = (e) => {
                        e.stopPropagation();
                        dropdown.style.display = 'none';
                        opt.action();
                    };
                    dropdown.appendChild(item);
                });
            };

            // Execute the dynamic builder only when clicked
            hamburgerBtn.onclick = (e) => {
                e.stopPropagation();
                if (dropdown.style.display === 'flex') {
                    dropdown.style.display = 'none';
                } else {
                    populateMenu(); // Rebuild the menu to match the active room state
                    dropdown.style.display = 'flex';
                }
            };

            const title = document.createElement('div');
            title.innerText = 'Chatbox';
            Object.assign(title.style, { color: '#f8fafc', fontSize: '14px', fontWeight: 'bold', fontFamily: 'sans-serif' });
            
            centerZone.appendChild(hamburgerBtn);
            centerZone.appendChild(dropdown);
            centerZone.appendChild(title);

            document.addEventListener('click', () => { dropdown.style.display = 'none'; });

            const voiceIcon = document.createElement('div');
            Object.assign(voiceIcon.style, { width: '60px', display: 'flex', justifyContent: 'flex-end', cursor: 'pointer', transition: 'opacity 0.2s' });
            voiceIcon.innerHTML = `<svg id="tao-voice-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a8c7fa" stroke-width="2.5" stroke-linecap="round" style="transition: stroke 0.3s ease;"><path d="M12 3v18M17 8v8M7 8v8M22 11v2M2 11v2"/></svg>`;
            
            voiceIcon.onmouseover = () => voiceIcon.style.opacity = '0.7';
            voiceIcon.onmouseout = () => voiceIcon.style.opacity = '1';
            voiceIcon.onclick = () => {
                isVoiceActive = !isVoiceActive;
                const svg = document.getElementById('tao-voice-svg');
                if (svg) svg.style.stroke = isVoiceActive ? '#ef4444' : '#a8c7fa'; 
                window.dispatchEvent(new CustomEvent('tao-voice-toggled', { detail: { active: isVoiceActive } }));
            };
            
            header.append(trafficLights, centerZone, voiceIcon);
            chatWindow.insertBefore(header, contentArea);

            const { renderChatbox } = await import('./components/chatbox.js');
            renderChatbox(contentArea, { showChatbox: true }); 
        }, 100);

        window.TAO_TOGGLE_CHATBOX = () => {
            if (chatWindow.style.display === 'none') {
                chatWindow.style.display = 'flex';
                chatWindow.classList.remove('is-minimized');
                if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(chatWindow);
                window.dispatchEvent(new CustomEvent('tao-chatbox-opened'));
            } else {
                isVoiceActive = false;
                const svg = document.getElementById('tao-voice-svg');
                if (svg) svg.style.stroke = '#a8c7fa';
                window.dispatchEvent(new CustomEvent('tao-chatbox-closed'));
                chatWindow.style.transition = 'all 0.3s ease';
                chatWindow.style.transform = 'translateY(100vh) scale(0.8)';
                chatWindow.style.opacity = '0';
                setTimeout(() => { 
                    chatWindow.style.display = 'none'; chatWindow.classList.add('is-minimized'); 
                    chatWindow.style.transform = 'none'; chatWindow.style.opacity = '1'; 
                }, 300);
            }
        };

        log("SYSTEM", "Global Chatbox System successfully mounted in standby.");
    } catch (e) {
        log("ERROR", "Failed to mount Chatbox Window.", e.message);
    }

    log("SYSTEM", "TAO OS Boot sequence completed.");
}

bootSystem();