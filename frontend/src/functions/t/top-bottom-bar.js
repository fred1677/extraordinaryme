/**
 * ============================================================================
 * MODULE: /frontend/src/functions/t/top-bottom-bar.js
 * 
 * THE DUAL-DOCK FACTORY (System Chrome)
 * ============================================================================
 */

export function initTopBottomBar() {
    
    const createDockForWorkspace = (workspaceId, isSecureTheme) => {
        const workspace = document.getElementById(workspaceId);
        if (!workspace) return;

        const barHeight = 44; 
        const edgePadding = 12; 

        const bottomDock = document.createElement('div');
        bottomDock.className = 'tao-os-bottom-dock'; 
        Object.assign(bottomDock.style, {
            position: 'absolute', bottom: '0px', left: '0', width: '100vw',
            height: `${barHeight}px`, 
            backgroundColor: isSecureTheme ? '#0f172a' : '#ffffff', 
            borderTop: `1px solid ${isSecureTheme ? '#1e293b' : '#e2e8f0'}`, 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            padding: `0 ${edgePadding}px`, pointerEvents: 'auto', 
            zIndex: '52000', boxSizing: 'border-box'
        });

        const dockItemsContainer = document.createElement('div');
        Object.assign(dockItemsContainer.style, {
            display: 'flex', alignItems: 'center', gap: '8px', flex: '1'
        });

        document.addEventListener('tao-window-docked', (e) => {
            const { winElement, title } = e.detail;
            
            const isGlobalApp = winElement.classList.contains('tao-system-window');
            const belongsToThisWorkspace = winElement.parentNode?.id === workspaceId;

            if (!isGlobalApp && !belongsToThisWorkspace) return;

            // 🚀 THE FIX: Replaces the hyphen with an underscore to prevent the DOMStringMap crash
            const safeWorkspaceId = workspaceId.replace('-', '_'); 
            const namespaceKey = `docked_${safeWorkspaceId}`;
            
            if (winElement.dataset[namespaceKey] === 'true') return;
            winElement.dataset[namespaceKey] = 'true';

            const dockItem = document.createElement('div');
            dockItem.dataset.windowId = winElement.id || 'unknown'; 
            dockItem.className = 'docked-app-icon';
            
            Object.assign(dockItem.style, {
                width: '32px', height: '32px', borderRadius: '6px', 
                backgroundColor: isSecureTheme ? '#1e293b' : '#0f172a', 
                border: `1px solid ${isSecureTheme ? '#334155' : '#1e293b'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff', fontSize: '11px', fontWeight: 'bold',
                cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
            });
            
            dockItem.innerText = title ? title.substring(0, 2) : 'OS';
            dockItem.title = title;

            dockItem.onmouseover = () => { 
                dockItem.style.transform = 'translateY(-4px)'; 
                dockItem.style.backgroundColor = '#38bdf8'; 
                dockItem.style.borderColor = '#0284c7';
            };
            dockItem.onmouseout = () => { 
                dockItem.style.transform = 'none'; 
                dockItem.style.backgroundColor = isSecureTheme ? '#1e293b' : '#0f172a'; 
                dockItem.style.borderColor = isSecureTheme ? '#334155' : '#1e293b';
            };

            dockItem.onclick = (ev) => {
                ev.stopPropagation();
                
                winElement.style.display = 'flex';
                setTimeout(() => {
                    winElement.style.transform = 'none';
                    winElement.style.opacity = '1';
                    if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(winElement);
                }, 10);
                
                delete winElement.dataset.docked_user_workspace;
                delete winElement.dataset.docked_backend_workspace;
                
                const globalIcons = document.querySelectorAll(`.docked-app-icon[data-window-id="${winElement.id}"]`);
                globalIcons.forEach(icon => icon.remove());
            };

            dockItemsContainer.appendChild(dockItem);
        });

        const trashCan = document.createElement('div');
        trashCan.title = 'Trash (Items kept for 30 days)';
        Object.assign(trashCan.style, {
            width: '36px', height: '36px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', 
            color: isSecureTheme ? '#475569' : '#64748b', 
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
        });

        trashCan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        trashCan.onmouseover = () => {
            trashCan.style.color = '#ef4444'; trashCan.style.transform = 'scale(1.1)';
        };
        trashCan.onmouseout = () => {
            trashCan.style.color = isSecureTheme ? '#475569' : '#64748b'; trashCan.style.transform = 'none';
        };

        if (!window.TAO_ENGINE) window.TAO_ENGINE = {};
        if (!window.TAO_ENGINE.cinematicTrash) {
            window.TAO_ENGINE.cinematicTrash = (elementToTrash, itemName = 'Item') => {
                if (!elementToTrash) return;
                
                const activeTrash = document.querySelector('.tao-os-bottom-dock:visible #tao-os-trashcan') || trashCan;
                const trashRect = activeTrash.getBoundingClientRect();
                const trashCenterY = trashRect.top + (trashRect.height / 2);
                
                elementToTrash.style.transition = 'all 0.7s cubic-bezier(0.5, 0, 0.2, 1)';
                elementToTrash.style.transform = `translateY(${trashCenterY}px) scale(0) rotate(360deg)`;
                elementToTrash.style.opacity = '0';
                
                setTimeout(() => { activeTrash.style.transform = 'scale(1.3)'; activeTrash.style.color = '#ef4444'; }, 300);
                setTimeout(() => { activeTrash.style.transform = 'none'; activeTrash.style.color = isSecureTheme ? '#475569' : '#64748b'; }, 500);

                setTimeout(() => {
                    elementToTrash.style.display = 'none'; elementToTrash.remove();
                    console.log(`[Trash System] "${itemName}" moved to Trash.`);
                }, 700);
            };
        }

        bottomDock.appendChild(dockItemsContainer);
        bottomDock.appendChild(trashCan);
        workspace.appendChild(bottomDock);
    };

    createDockForWorkspace('user-workspace', false);
    createDockForWorkspace('backend-workspace', true);
}