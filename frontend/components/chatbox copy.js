/**
 * ============================================================================
 * MODULE: /frontend/components/chatbox.js
 * 
 * FUNCTION: Global AI Assistant Chat Interface (TEXT & VOICE MODE).
 * 
 * FEATURES:
 * 1. Zero-Trust Live Database Clearance Verification.
 * 2. Context-Aware Power Commands (Acts locally on the active workspace).
 * 3. Air-gapped Workspace Toggling (Tao Mode / User Mode).
 * 4. Half-Duplex Voice Engine (Listens to header toggle, prevents audio feedback).
 * 5. UNIVERSAL PROMPT API (Dynamically accepts text, buttons, and awaits input).
 * 
 * ============================================================================
 * CHATBOX API v1.0: SYNTAX & USAGE
 * ============================================================================
 * The Chatbox acts as a generic UI micro-service. Other modules can invoke it 
 * by dispatching the 'tao-chatbox-prompt' event.
 * 
 * EVENT DISPATCH STRUCTURE:
 * window.dispatchEvent(new CustomEvent('tao-chatbox-prompt', {
 *     detail: {
 *         message: "String. The prompt to display/speak. Supports \n for newlines.",
 *         waitForInput: Boolean. If true, hijacks input until the user responds.
 *         choices: ["Array", "of", "Strings"]. Renders clickable Yes/No buttons. Optional.
 *         responseEvent: "String". The custom event name the Chatbox will fire back to you.
 *     }
 * }));
 * 
 * RETURN PAYLOAD:
 * The Chatbox will fire the 'responseEvent' back to the calling module containing:
 * e.detail.text // The typed text, the skipped '0', or the button clicked.
 * ============================================================================
 */

export function renderChatbox(targetElement, options = {}) {
    if (document.getElementById('tao-chatbox-wrapper')) return;

    const orbSize = window.TAO_USER_CONFIG?.orbSize || window.TAO_SYSTEM_CONFIG?.HARDWARE?.ORB_BASE_SIZE || 44;

    const layoutWrapper = document.createElement('div');
    layoutWrapper.id = 'tao-chatbox-wrapper';
    layoutWrapper.style.cssText = `
        display: flex; flex-direction: column; justify-content: flex-end; 
        width: 100%; height: 100%; padding: 12px; box-sizing: border-box; 
        background-color: transparent; pointer-events: auto; position: relative;
    `;

    const messageWrapper = document.createElement('div');
    messageWrapper.style.cssText = `
        flex-grow: 1; width: 100%; border: 1px solid #334155; border-radius: 12px; 
        background-color: rgba(11, 17, 32, 0.95); display: flex; flex-direction: column; 
        overflow: hidden; margin-bottom: 12px; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); 
        position: relative;
    `;

    const messageArea = document.createElement('div');
    messageArea.style.cssText = `
        width: 100%; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; 
        gap: 16px; padding: 16px; scrollbar-width: none; box-sizing: border-box;
    `;
    messageArea.innerHTML = `<style>#msg-area::-webkit-scrollbar { display: none; }</style>`;
    messageArea.id = 'msg-area';

    const inputArea = document.createElement('textarea');
    messageWrapper.appendChild(messageArea);

    const appendMessage = (sender, text) => {
        const msgRow = document.createElement('div');
        msgRow.style.cssText = `display: flex; width: 100%; justify-content: ${sender === 'user' ? 'flex-end' : 'flex-start'}; box-sizing: border-box;`;
        
        let bgColor = sender === 'user' ? '#10b981' : '#f0f4f9';
        let textColor = sender === 'user' ? '#0f172a' : '#1f1f1f';
        let fontW = sender === 'user' ? 'bold' : 'normal';

        if (sender === 'system') {
            bgColor = 'transparent'; textColor = '#ef4444'; fontW = 'bold';
        }

        const bubble = document.createElement('div');
        bubble.style.cssText = `
            background-color: ${bgColor}; color: ${textColor}; padding: 8px 16px; border-radius: 16px; 
            max-width: 90%; font-family: sans-serif; font-size: 13px; line-height: 1.5;
            box-shadow: ${sender === 'system' ? 'none' : '0 2px 4px rgba(0,0,0,0.3)'}; 
            font-weight: ${fontW}; border: ${sender === 'system' ? '1px dashed #ef4444' : 'none'};
            white-space: pre-wrap; word-wrap: break-word;
        `;
        bubble.textContent = text;
        msgRow.appendChild(bubble);
        messageArea.appendChild(msgRow);
        messageArea.scrollTop = messageArea.scrollHeight; 
    };

    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `display: flex; align-items: flex-end; justify-content: center; width: 100%; flex-shrink: 0; box-sizing: border-box;`;

    const chatBox = document.createElement('div');
    chatBox.style.cssText = `display: flex; align-items: flex-end; background-color: #f0f4f9; border-radius: 20px; padding: 6px 6px 6px 12px; flex-grow: 1; box-shadow: 0 4px 12px rgba(0,0,0,0.4); box-sizing: border-box;`;
    
    inputArea.placeholder = "Message TAO...";
    inputArea.style.cssText = `
        border: none; outline: none; background: transparent; flex-grow: 1; 
        font-size: 14px; padding: 10px 10px 10px 0; color: #1f1f1f; font-family: sans-serif;
        resize: none; overflow-y: auto; line-height: 1.2; 
        height: 38px; min-height: 38px; max-height: 100px; 
    `;

    inputArea.addEventListener('input', () => {
        inputArea.style.height = '38px'; 
        inputArea.style.height = `${Math.min(inputArea.scrollHeight, 100)}px`;
    });

    inputArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    const sendBtn = document.createElement('button');
    const arrowIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
    sendBtn.innerHTML = arrowIcon;
    sendBtn.style.cssText = `
        background-color: #a8c7fa; border: none; border-radius: 50%; width: ${orbSize}px; height: ${orbSize}px; 
        cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background-color 0.2s ease; margin-bottom: 0;
    `;
    
    chatBox.appendChild(inputArea);
    chatBox.appendChild(sendBtn);
    inputContainer.appendChild(chatBox);

    // ========================================================================
    // 🚀 VOICE CHAT ENGINE
    // ========================================================================
    let isVoiceMode = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
            inputArea.value = event.results[0][0].transcript;
            handleSend(); 
        };

        recognition.onend = () => {
            if (isVoiceMode && !window.speechSynthesis.speaking) {
                try { recognition.start(); } catch(e) {}
            }
        };
    }

    window.addEventListener('tao-voice-toggled', (e) => {
        isVoiceMode = e.detail.active;
        if (isVoiceMode) {
            console.log('[Voice Engine] Engaged.');
            if (recognition) { try { recognition.start(); } catch (err) {} }
        } else {
            console.log('[Voice Engine] Disengaged.');
            if (recognition) recognition.stop();
            window.speechSynthesis.cancel(); 
        }
    });

    window.addEventListener('tao-chatbox-closed', () => {
        isVoiceMode = false;
        if (recognition) recognition.stop();
        window.speechSynthesis.cancel();
    });

    const speakResponse = (text) => {
        if (!isVoiceMode) return;
        
        const cleanText = text.replace(/\[.*?\]/g, '').trim();
        window.speechSynthesis.cancel();
        
        if (recognition) recognition.stop(); 

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05; 
        
        utterance.onend = () => {
            if (isVoiceMode && recognition) {
                try { recognition.start(); } catch (e) {}
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    // ========================================================================
    // 🚀 UNIVERSAL PROMPT API
    // ========================================================================
    let activePromptEvent = null;

    window.addEventListener('tao-chatbox-prompt', (e) => {
        const { message, waitForInput, choices, responseEvent } = e.detail;

        if (!isVoiceMode) {
            isVoiceMode = true;
            const svg = document.getElementById('tao-voice-svg');
            if (svg) svg.style.stroke = '#ef4444'; 
            if (recognition) { try { recognition.start(); } catch (err) {} }
        }

        if (message) {
            appendMessage('tao', message);
            speakResponse(message);
        }

        activePromptEvent = responseEvent;

        if (choices && choices.length > 0) {
            const btnRow = document.createElement('div');
            btnRow.id = 'tao-dynamic-btns';
            btnRow.style.cssText = `display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;`;
            
            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.innerText = choice;
                
                let bgColor = '#64748b'; 
                if (choice.toLowerCase() === 'yes') bgColor = '#10b981'; 
                if (choice.toLowerCase() === 'no') bgColor = '#ef4444';  

                btn.style.cssText = `
                    background-color: ${bgColor}; color: #ffffff; border: none; border-radius: 16px; 
                    padding: 8px 20px; cursor: pointer; font-size: 13px; font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3); transition: opacity 0.2s;
                `;
                btn.onmouseover = () => btn.style.opacity = '0.8';
                btn.onmouseout = () => btn.style.opacity = '1';
                
                btn.onclick = () => {
                    btnRow.remove();
                    appendMessage('user', choice);
                    if (activePromptEvent) {
                        window.dispatchEvent(new CustomEvent(activePromptEvent, { detail: { text: choice } }));
                        activePromptEvent = null; 
                    }
                };
                btnRow.appendChild(btn);
            });
            messageArea.appendChild(btnRow);
            messageArea.scrollTop = messageArea.scrollHeight;
        } 
        else if (!waitForInput) {
            activePromptEvent = null;
            if (responseEvent) {
                window.dispatchEvent(new CustomEvent(responseEvent, { detail: { text: '' } }));
            }
        }
    });

    // ========================================================================
    // THE SMART INTERCEPTOR & COMMAND ROUTER
    // ========================================================================
    const handleSend = async () => {
        let text = inputArea.value.trim();

        // --------------------------------------------------------------------
        // 1. INTERCEPTOR: Hijack text input if a module is waiting for data
        // --------------------------------------------------------------------
        if (activePromptEvent) {
            if (!text) text = '0'; 
            
            appendMessage('user', text === '0' ? '(Skipped)' : text);
            inputArea.value = ''; 
            inputArea.style.height = '38px'; 

            const existingBtns = document.getElementById('tao-dynamic-btns');
            if (existingBtns) existingBtns.remove(); 

            window.dispatchEvent(new CustomEvent(activePromptEvent, { detail: { text: text } }));
            activePromptEvent = null; 
            return;
        }

        // --------------------------------------------------------------------
        // 2. NORMAL OPERATION 
        // --------------------------------------------------------------------
        if (!text) return;
        
        appendMessage('user', text);
        inputArea.value = ''; 
        inputArea.style.height = '38px'; 

        const lowerCmd = text.toLowerCase();
        const currentMode = window.TAO_ENGINE?.getWorkspaceBounds?.().mode || 'standard';

        if (['logout', 'log off', 'sign out', 'sign off', 'shut down', 'shutdown', 'shut-down'].includes(lowerCmd)) {
            if (isVoiceMode && recognition) recognition.stop();
            if (currentMode === 'backend') {
                appendMessage('system', 'Purging classified workspace. Restoring Public Environment...');
                const backendWorkspace = document.getElementById('backend-workspace');
                if (backendWorkspace) { backendWorkspace.innerHTML = ''; backendWorkspace.style.display = 'none'; }
                setTimeout(async () => {
                    try {
                        const { initHomeScreen } = await import('../screen-panels/home-screen.js?v=' + new Date().getTime());
                        await initHomeScreen();
                    } catch (err) {}
                }, 500);
            } else {
                if (lowerCmd.includes('shut')) {
                    appendMessage('system', "System shutting down...");
                    setTimeout(() => { document.body.innerHTML = ''; document.body.style.backgroundColor = '#000000'; }, 1000);
                } else {
                    appendMessage('system', "Storing session state and signing out...");
                    setTimeout(() => {
                        localStorage.setItem('TAO_RESTORE_SESSION', 'true');
                        localStorage.removeItem('TAO_SESSION_TOKEN');
                        window.location.reload(); 
                    }, 800);
                }
            }
            return;
        }

        if (['restart', 'reboot'].includes(lowerCmd)) {
            if (isVoiceMode && recognition) recognition.stop();
            if (currentMode === 'backend') {
                appendMessage('system', "Rebooting Tao Workspace...");
                const backendWorkspace = document.getElementById('backend-workspace');
                if (backendWorkspace) backendWorkspace.innerHTML = ''; 
                setTimeout(async () => {
                    try {
                        const { initTaoHomeScreen } = await import('../screen-panels/tao-home-screen.js?v=' + new Date().getTime());
                        await initTaoHomeScreen();
                    } catch(err) {}
                }, 500);
            } else {
                appendMessage('system', "Wiping session state and rebooting TAO OS...");
                setTimeout(() => {
                    localStorage.removeItem('TAO_RESTORE_SESSION');
                    localStorage.removeItem('TAO_SESSION_TOKEN');
                    window.location.reload(); 
                }, 800);
            }
            return;
        }

        if (lowerCmd === 'sleep') {
            if (isVoiceMode && recognition) recognition.stop();
            appendMessage('system', "Entering Sleep Mode. Click anywhere to wake.");
            const sleepScreen = document.createElement('div');
            Object.assign(sleepScreen.style, { position: 'fixed', inset: '0', backgroundColor: '#000000', zIndex: '99999', cursor: 'pointer' });
            sleepScreen.onclick = () => sleepScreen.remove();
            document.body.appendChild(sleepScreen);
            return;
        }

        if (['enter backend', 'tao mode'].includes(lowerCmd)) {
            if (isVoiceMode && recognition) recognition.stop();
            const activeUserId = localStorage.getItem('TAO_SESSION_TOKEN');
            let hasClearance = false;
            if (activeUserId) {
                try {
                    const checkResponse = await fetch('/api/auth/check-clearance', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: activeUserId })
                    });
                    const authData = await checkResponse.json();
                    hasClearance = authData.is_taouser === true;
                } catch (err) { console.error("[Security] Live check failed:", err); }
            }
            if (!hasClearance) {
                const denyMsg = "I don't know how to enter Tao Mode.";
                appendMessage('tao', denyMsg);
                speakResponse(denyMsg);
                return;
            }
            appendMessage('system', 'Initiating Level-2 Security Protocol...');
            if (window.TAO_TOGGLE_CHATBOX) window.TAO_TOGGLE_CHATBOX();
            try {
                const { initTaoLogin } = await import('./tao-login.js?v=' + new Date().getTime());
                await initTaoLogin();
            } catch (err) { appendMessage('system', 'Failed to initialize security protocol.'); }
            return;
        }

        if (['exit backend', 'user mode'].includes(lowerCmd)) {
            if (isVoiceMode && recognition) recognition.stop();
            appendMessage('system', 'Hiding Tao Workspace. Restoring Public Environment...');
            try {
                const { initHomeScreen } = await import('../screen-panels/home-screen.js?v=' + new Date().getTime());
                await initHomeScreen();
                appendMessage('tao', 'You are now back in User Mode.');
            } catch (err) { console.error('[Chatbox] Failed to restore home screen:', err); }
            return;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }) 
            });

            if (response.ok) {
                const data = await response.json();
                const replyText = data.reply || data.response || "No response received.";
                appendMessage('tao', replyText);
                speakResponse(replyText);
            } else { 
                appendMessage('system', `Inference request failed. HTTP ${response.status}`); 
            }
        } catch (err) { 
            appendMessage('system', 'Unable to connect to backend.'); 
        }
    };

    sendBtn.addEventListener('click', handleSend);

    window.addEventListener('tao-chatbox-opened', () => {
        if (messageArea.children.length === 0) appendMessage('tao', "Hi, how may I help you?");
        inputArea.focus(); 
    });

    layoutWrapper.appendChild(messageWrapper);         
    layoutWrapper.appendChild(inputContainer);  
    targetElement.appendChild(layoutWrapper);
}