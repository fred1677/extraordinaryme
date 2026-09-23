// File: /frontend/components/opendrawer.js

/**
 * ============================================================================
 * MODULE: /frontend/components/opendrawer.js
 * 
 * FUNCTION: 
 * The Unified 4-Way Drawer Controller. Handles both the physical construction 
 * of the drawers in the DOM and the operational logic to open/close them.
 * ============================================================================
 * 
 * ARCHITECTURE UPDATE:
 * - 50% Rule: All drawers strictly capped at 50% width/height.
 * - Dual-Zone Bottom Drawer: The bottom drawer is split into Left (Favorites) 
 *   and Right (Active Sessions) to handle overflow from the Bottom Dock.
 * - .n Pagination Engine: Dynamically chunks large arrays into pages based on 
 *   the exact ORB_BASE_SIZE defined in the SSOT configuration.
 * ============================================================================
 */

export const OS_DRAWERS = {};

export function initDrawers(targetElement) {
    const layerId = window.TAO_SYSTEM_CONFIG?.LAYERS?.DRAWER?.id || 'layer-4-drawer';
    const layer4 = document.getElementById(layerId) || targetElement || document.body;

    if (document.getElementById('tao-drawer-wrapper')) return;

    const style = document.createElement('style');
    style.textContent = `
        .drawer-overlay { 
            position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(15, 23, 42, 0.6); 
            display: none; backdrop-filter: blur(2px);
            pointer-events: auto; z-index: 10;
        }
        
        .drawer-wrapper { 
            position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 20;
        }
        
        .drawer { 
            position: absolute; background: rgba(15, 23, 42, 0.95); 
            transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.05); 
            box-shadow: 0 0 35px rgba(0,0,0,0.9); 
            box-sizing: border-box; overflow-y: hidden; color: #e2e8f0; 
            pointer-events: auto; backdrop-filter: blur(10px);
        }
        
        .drawer-left { top: 0; left: 0; width: 50vw; height: 100%; transform: translateX(-100%); border-right: 1px solid #38bdf8; }
        .drawer-right { top: 0; right: 0; width: 50vw; height: 100%; transform: translateX(100%); border-left: 1px solid #f59e0b; }
        .drawer-top { top: 0; left: 0; width: 100%; height: 50vh; transform: translateY(-100%); border-bottom: 1px solid #10b981; }
        .drawer-bottom { bottom: 0; left: 0; width: 100%; height: 50vh; transform: translateY(100%); border-top: 1px solid #8b5cf6; }
        
        .drawer-content-container { 
            width: 100%; height: 100%; display: flex; flex-direction: column;
            overflow-y: auto; overflow-x: hidden; padding: 16px; box-sizing: border-box;
        }

        /* Dual Zone Splitting for Bottom Drawer */
        .dual-zone-row {
            display: flex; flex-direction: row; width: 100%; height: 100%;
        }
        .zone-column {
            flex: 1; display: flex; flex-direction: column; overflow-y: auto;
        }
        .zone-divider {
            width: 2px; background: rgba(255, 255, 255, 0.2); margin: 0 16px; border-radius: 2px;
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'tao-drawer-overlay';

    const drawerWrapper = document.createElement('div');
    drawerWrapper.className = 'drawer-wrapper';
    drawerWrapper.id = 'tao-drawer-wrapper';
    
    // >>> THE FIX: The Bottom Drawer is now explicitly split into Two Zones
    drawerWrapper.innerHTML = `
        <div class="drawer drawer-left" id="drawer-left">
            <div class="drawer-content-container" id="drawer-left-content"></div>
        </div>
        <div class="drawer drawer-right" id="drawer-right">
            <div class="drawer-content-container" id="drawer-right-content"></div>
        </div>
        <div class="drawer drawer-top" id="drawer-top">
            <div class="drawer-content-container" id="drawer-top-content"></div>
        </div>
        <div class="drawer drawer-bottom" id="drawer-bottom">
            <div class="drawer-content-container dual-zone-row" id="drawer-bottom-content">
                <div class="zone-column" id="drawer-bottom-favorites"></div>
                <div class="zone-divider"></div>
                <div class="zone-column" id="drawer-bottom-sessions"></div>
            </div>
        </div>
    `;

    layer4.appendChild(overlay);
    layer4.appendChild(drawerWrapper);

    OS_DRAWERS.overlay = overlay;
    OS_DRAWERS.left = { element: document.getElementById('drawer-left'), closed: 'translateX(-100%)', open: 'translateX(0)', isOpen: false };
    OS_DRAWERS.right = { element: document.getElementById('drawer-right'), closed: 'translateX(100%)', open: 'translateX(0)', isOpen: false };
    OS_DRAWERS.top = { element: document.getElementById('drawer-top'), closed: 'translateY(-100%)', open: 'translateY(0)', isOpen: false };
    OS_DRAWERS.bottom = { element: document.getElementById('drawer-bottom'), closed: 'translateY(100%)', open: 'translateY(0)', isOpen: false };

    overlay.addEventListener('click', closeAllDrawers);

    window.TAO_ENGINE = window.TAO_ENGINE || {};
    window.TAO_ENGINE.closeAllDrawers = closeAllDrawers;
    window.TAO_ENGINE.toggleDrawer = toggleDrawer;
    window.TAO_ENGINE.populateDrawer = populateDrawer; 
}

export function toggleDrawer(position) {
    const target = OS_DRAWERS[position];
    if (!target) return;

    if (target.isOpen) {
        target.element.style.transform = target.closed;
        target.isOpen = false;
        
        const anyOpen = Object.values(OS_DRAWERS).some(d => d.isOpen && d.element);
        if (!anyOpen) OS_DRAWERS.overlay.style.display = 'none';
    } else {
        closeAllDrawers();
        target.element.style.transform = target.open;
        target.isOpen = true;
        OS_DRAWERS.overlay.style.display = 'block';
    }
}

export function closeAllDrawers() {
    ['left', 'right', 'top', 'bottom'].forEach(pos => {
        const d = OS_DRAWERS[pos];
        if (d && d.isOpen) {
            d.element.style.transform = d.closed;
            d.isOpen = false;
        }
    });
    if (OS_DRAWERS.overlay) {
        OS_DRAWERS.overlay.style.display = 'none';
    }
}

/**
 * ============================================================================
 * DRAWER PAGINATION ENGINE (.n Sub-Drawers)
 * Calculates exact screen constraints based on hardware orb size.
 * Usage: populateDrawer('drawer-left-content', myGalaxies, 'Galaxies');
 *        populateDrawer('drawer-bottom-sessions', mySweptApps, 'Active Sessions');
 * ============================================================================
 */
export function populateDrawer(containerId, itemsArray, drawerTitle) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Strict SSOT Hardware Inheritance
    const orbSize = window.TAO_USER_CONFIG?.orbSize || window.TAO_SYSTEM_CONFIG?.HARDWARE?.ORB_BASE_SIZE || 44; 
    const topBarHeight = window.TAO_SYSTEM_CONFIG?.HARDWARE?.TOP_BAR_HEIGHT || (orbSize + 0.8);
    
    const cardPadding = 16;
    const cardHeight = orbSize + cardPadding; 
    
    // Check if container is inside a vertical drawer (top/bottom) or horizontal (left/right)
    const isVerticalDrawer = containerId.includes('top') || containerId.includes('bottom');
    const rawHeight = isVerticalDrawer ? (window.innerHeight * 0.5) : window.innerHeight;
    const usableHeight = rawHeight - topBarHeight - 60; // 60px reserved for title/pagination header
    
    const maxItemsPerPage = Math.max(1, Math.floor(usableHeight / cardHeight));
    
    const pages = [];
    for (let i = 0; i < itemsArray.length; i += maxItemsPerPage) {
        pages.push(itemsArray.slice(i, i + maxItemsPerPage));
    }

    let currentPage = 0;

    const renderPage = (pageIndex) => {
        container.innerHTML = ''; 
        
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 10px; margin-bottom: 10px; flex-shrink: 0;';
        
        // Color coding based on zone intent
        let titleColor = '#10b981';
        if (containerId.includes('sessions')) titleColor = '#f59e0b';
        if (containerId.includes('right')) titleColor = '#f59e0b';

        header.innerHTML = `<h3 style="margin:0; color:${titleColor}; font-size: 16px;">${drawerTitle}</h3>`;
        
        if (pages.length > 1) {
            const pageControl = document.createElement('div');
            pageControl.style.cssText = 'color: #94a3b8; font-family: monospace; font-size: 12px; display: flex; gap: 10px; align-items: center;';
            
            const prevBtn = document.createElement('button');
            prevBtn.innerText = '<';
            prevBtn.style.cssText = `background:none; border:1px solid #475569; color:#fff; cursor:${pageIndex > 0 ? 'pointer' : 'not-allowed'}; opacity:${pageIndex > 0 ? '1' : '0.5'}`;
            prevBtn.onclick = () => { if (pageIndex > 0) renderPage(pageIndex - 1); };

            const nextBtn = document.createElement('button');
            nextBtn.innerText = '>';
            nextBtn.style.cssText = `background:none; border:1px solid #475569; color:#fff; cursor:${pageIndex < pages.length - 1 ? 'pointer' : 'not-allowed'}; opacity:${pageIndex < pages.length - 1 ? '1' : '0.5'}`;
            nextBtn.onclick = () => { if (pageIndex < pages.length - 1) renderPage(pageIndex + 1); };

            pageControl.appendChild(prevBtn);
            pageControl.innerHTML += `<span>.${pageIndex + 1}</span>`;
            pageControl.appendChild(nextBtn);
            
            header.appendChild(pageControl);
        }
        
        container.appendChild(header);

        const currentItems = pages[pageIndex] || [];
        currentItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.style.cssText = `
                height: ${orbSize}px; 
                margin-bottom: ${cardPadding}px; 
                background: #1e293b; 
                border-radius: 8px; 
                display: flex; align-items: center; padding: 0 10px;
                cursor: pointer; border: 1px solid #334155; flex-shrink: 0;
            `;
            itemEl.innerText = item.name;
            itemEl.onclick = () => {
                if (item.action) item.action();
            };
            container.appendChild(itemEl);
        });
    };

    renderPage(currentPage);
}