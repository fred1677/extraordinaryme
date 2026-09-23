/**
 * ============================================================================
 * MODULE: /frontend/src/Universe/Me/Me.js
 * 
 * ME.JS MASTER ARCHITECTURE & DOCUMENTATION
 * 
 * 1. Core Engine & Persona
 *    - Function: OS digital twin and context router. Emulates human perception layers.
 *    - Persona: Brief, direct, zero chattiness. No wasted words.
 * 
 * 2. Execution Environment
 *    - Standard Application: Now operates as a standard GUI application launched 
 *      from the Desktop Canvas. Receives an injected UI `container` from the 
 *      Window Manager frame.
 * ============================================================================
 */

export function runMe(container) {
    let targetArea = container;
    let standaloneWindow = null;

    // Fallback: If executed outside the Home Screen, wrap itself in a window
    if (!targetArea) {
        standaloneWindow = document.createElement('div');
        standaloneWindow.id = 'me-router-window';
        standaloneWindow.classList.add('tao-workspace-window'); 
        Object.assign(standaloneWindow.style, {
            backgroundColor: '#0f172a',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
        });

        targetArea = document.createElement('div');
        Object.assign(targetArea.style, {
            flex: '1', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            position: 'relative'
        });
        
        standaloneWindow.appendChild(targetArea);

        const osRoot = document.getElementById('tao-os-root') || document.body;
        osRoot.appendChild(standaloneWindow);

        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(standaloneWindow, 'Me - Module');
        }
    } else {
        // 🚀 UI FIX: Apply the dark slate background directly to the injected container
        Object.assign(targetArea.style, {
            backgroundColor: '#0f172a',
            display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            position: 'relative'
        });
    }

    const nodes = [
        { id: 'see', label: 'See', color: '#38bdf8', prompt: 'What did you see?' },
        { id: 'touch', label: 'Touch / State', color: '#fb923c', prompt: 'What did you touch or feel?' },
        { id: 'hear', label: 'Hear', color: '#a78bfa', prompt: 'What did you hear?' },
        { id: 'taste', label: 'Taste', color: '#f43f5e', prompt: 'What did you taste?' },
        { id: 'smell', label: 'Smell', color: '#34d399', prompt: 'What did you smell?' },
        { id: 'thought', label: 'Thought', color: '#facc15', prompt: 'What are you thinking?' },
        { id: 'command', label: 'Command', color: '#94a3b8', prompt: 'Target system function.' },
        { id: 'action', label: 'Action', color: '#22c55e', prompt: 'What did you do, or want to do?' }
    ];

    const grid = document.createElement('div');
    Object.assign(grid.style, {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
        width: '100%', maxWidth: '600px'
    });

    const promptUI = document.createElement('div');
    Object.assign(promptUI.style, { 
        display: 'none', flexDirection: 'column', width: '100%', 
        maxWidth: '400px', gap: '16px' 
    });

    const promptLabel = document.createElement('div');
    Object.assign(promptLabel.style, { 
        color: '#e2e8f0', fontSize: '18px', fontWeight: 'bold', 
        fontFamily: 'sans-serif', textAlign: 'center' 
    });

    const promptInput = document.createElement('input');
    promptInput.type = 'text';
    Object.assign(promptInput.style, {
        width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155',
        backgroundColor: '#1e293b', color: '#fff', fontSize: '16px', outline: 'none'
    });

    const backBtn = document.createElement('button');
    backBtn.innerText = '← Cancel';
    Object.assign(backBtn.style, {
        background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
        alignSelf: 'center', marginTop: '8px'
    });

    promptUI.appendChild(promptLabel);
    promptUI.appendChild(promptInput);
    promptUI.appendChild(backBtn);

    const routeNode = (nodeId, promptText) => {
        grid.style.display = 'none';
        promptUI.style.display = 'flex';
        promptLabel.innerText = promptText;
        promptInput.value = '';
        promptInput.dataset.activeNode = nodeId;
        setTimeout(() => promptInput.focus(), 50);
    };

    backBtn.onclick = () => {
        promptUI.style.display = 'none';
        grid.style.display = 'grid';
    };

    promptInput.onkeydown = async (e) => {
        if (e.key === 'Enter' && promptInput.value.trim() !== '') {
            const targetNode = promptInput.dataset.activeNode;
            const payload = promptInput.value.trim();
            
            console.log(`[Me.js] Intercept: Node [${targetNode}] -> Payload: "${payload}"`);
            
            try {
                promptUI.style.display = 'none';
                grid.style.display = 'grid';
                if (standaloneWindow) standaloneWindow.style.display = 'none'; 
            } catch (err) {
                console.error(`Failed to route to Me.${targetNode}.js`, err);
            }
        }
    };

    nodes.forEach(node => {
        const btn = document.createElement('button');
        btn.innerText = node.label;
        Object.assign(btn.style, {
            aspectRatio: '1', backgroundColor: '#1e293b', border: `1px solid ${node.color}`,
            borderRadius: '12px', color: '#e2e8f0', fontSize: '14px', fontWeight: 'bold',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        });

        btn.onmouseover = () => { 
            btn.style.backgroundColor = node.color; 
            btn.style.color = '#0f172a'; 
            btn.style.transform = 'translateY(-2px)';
        };
        btn.onmouseout = () => { 
            btn.style.backgroundColor = '#1e293b'; 
            btn.style.color = '#e2e8f0'; 
            btn.style.transform = 'translateY(0)';
        };
        
        btn.onclick = () => routeNode(node.id, node.prompt);
        grid.appendChild(btn);
    });

    targetArea.appendChild(grid);
    targetArea.appendChild(promptUI);

    if (standaloneWindow && window.TAO_ENGINE?.bringToFront) {
        window.TAO_ENGINE.bringToFront(standaloneWindow);
    }
}