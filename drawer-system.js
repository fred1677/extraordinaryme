// File: /frontend/components/drawer-system.js

export function renderDrawerSystem(parentElement) {
    const style = document.createElement('style');
    style.textContent = `
        .drawer-overlay { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(15, 23, 42, 0.85); z-index: 190; 
            display: none; backdrop-filter: blur(4px);
        }
        
        .drawer-wrapper { 
            position: absolute; 
            top: var(--sys-header-height, 65px); 
            left: 50%; transform: translateX(-50%); 
            width: 100%; max-width: 900px; 
            height: calc(100dvh - var(--sys-header-height, 65px)); 
            pointer-events: none; overflow: hidden; z-index: 200; 
        }
        
        .drawer { 
            position: absolute; 
            /* >>> FIX 1: Significantly lighter slate background to pop off the void <<< */
            background: #334155 !important; 
            transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.05); 
            box-shadow: 0 0 35px rgba(0,0,0,0.9); 
            box-sizing: border-box; overflow-y: hidden; color: #fff; pointer-events: auto;
            
            top: 0; 
            height: 100%;
        }
        
        /* >>> FIX 2: True 50% width and thick, bright blue glowing borders <<< */
        .drawer-left { 
            left: 0; 
            width: 50% !important; 
            transform: translateX(-100%); 
            border-right: 3px solid #60a5fa !important; 
        }
        
        .drawer-right { 
            right: 0; 
            width: 50% !important; 
            transform: translateX(100%); 
            border-left: 3px solid #60a5fa !important; 
        }
        
        .drawer-top { 
            left: 0; 
            width: 100%; 
            height: 75%; 
            max-height: 500px; 
            transform: translateY(-100%); 
            border-bottom: 3px solid #60a5fa !important; 
            border-radius: 0 0 24px 24px; 
        }
        
        .drawer.open { transform: translate(0, 0); }

        .drawer-content-frame { width: 100%; height: 100%; border: none; background: transparent; }
    `;
    document.head.appendChild(style);

    const drawerWrapper = document.createElement('div');
    drawerWrapper.className = 'drawer-wrapper';
    
    drawerWrapper.innerHTML = `
        <div class="drawer drawer-left" id="drawer-left">
            <iframe src="about:blank" data-target="/messaging.html" class="drawer-content-frame" title="Communication Hub"></iframe>
        </div>
        <div class="drawer drawer-right" id="drawer-right">
            <iframe src="about:blank" data-target="/health.html" class="drawer-content-frame" title="Health Nexus"></iframe>
        </div>
        <div class="drawer drawer-top" id="drawer-top">
            <iframe src="about:blank" class="drawer-content-frame" title="Top Drawer"></iframe>
        </div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawer-overlay';

    overlay.addEventListener('click', () => {
        if (window.TAO_ENGINE && typeof window.TAO_ENGINE.closeAll === 'function') {
            window.TAO_ENGINE.closeAll();
        }
    });

    parentElement.appendChild(drawerWrapper);
    parentElement.appendChild(overlay);

    return { drawerWrapper, overlay };
}