/**
 * ============================================================================
 * MODULE: app-template.js (Standard OS Application Boilerplate)
 * 
 * STRUCTURE:
 * 1. State Management: Local variables and dictionaries for this app.
 * 2. OS Initialization: Window creation and OS Shell request.
 * 3. Canvas Construction: Pure white application area.
 * 4. Sticky Navigator: Fixed horizontal tab bar for quick-jumping.
 * 5. Functional Blocks: Vertical cards for data entry (Wake Up, Meals, etc.).
 * 6. Event Hub: Listeners for standard interactions and OS Signals.
 * ============================================================================
 */

// ============================================================================
// 1. LOCAL STATE & DICTIONARY
// ============================================================================
const state = {
    isProcessing: false,
    appData: {}
};

// Shorthand dictionary for the Hierarchical Intent Router
export const localDictionary = {
    name: "App Template",
    commands: ["function 1", "log data", "save template"]
};

export function initAppTemplate(container) {
    const moduleName = "App Template"; 
    const safeId = moduleName.toLowerCase().replace(/\s+/g, '-');
    
    // Prevent duplicate windows
    if (!container && document.getElementById(`tao-${safeId}-window`)) {
        const existingWin = document.getElementById(`tao-${safeId}-window`);
        if (window.TAO_ENGINE?.bringToFront) window.TAO_ENGINE.bringToFront(existingWin);
        return;
    }

    // ========================================================================
    // 2. OS WINDOW INITIALIZATION
    // ========================================================================
    let targetArea = container;
    let appWindow = null;

    if (!targetArea) {
        appWindow = document.createElement('div');
        appWindow.id = `tao-${safeId}-window`;
        appWindow.classList.add('tao-workspace-window', 'is-floating');
        
        Object.assign(appWindow.style, {
            position: 'fixed', top: '15%', left: '20%', width: '65vw', height: '70vh',
            minWidth: '360px', minHeight: '400px', backgroundColor: '#ffffff', 
            borderRadius: '12px', boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            pointerEvents: 'auto', zIndex: '21000'
        });

        // Auto-mount and decorate via Window Manager
        if (window.TAO_ENGINE && window.TAO_ENGINE.decorateAppWindow) {
            window.TAO_ENGINE.decorateAppWindow(appWindow, moduleName);
        }
        
        targetArea = appWindow;
    }

    // ========================================================================
    // 3. CANVAS CONSTRUCTION (The White Application Area)
    // ========================================================================
    const appCanvas = document.createElement('div');
    Object.assign(appCanvas.style, {
        flex: '1', width: '100%', backgroundColor: '#ffffff',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
    });

    // --- STANDARD APP TITLE ---
    const headerArea = document.createElement('div');
    Object.assign(headerArea.style, { padding: '24px 32px 16px 32px', flexShrink: '0', backgroundColor: '#ffffff', zIndex: '10' });

    const appTitle = document.createElement('h1');
    appTitle.innerText = `${moduleName} Module`;
    Object.assign(appTitle.style, {
        color: '#38bdf8', fontSize: '24px', fontWeight: 'bold', fontFamily: 'sans-serif', margin: '0'
    });
    headerArea.appendChild(appTitle);

    // ========================================================================
    // 4. STICKY NAVIGATOR (Tab Bar)
    // ========================================================================
    const tabBar = document.createElement('div');
    Object.assign(tabBar.style, {
        display: 'flex', gap: '24px', padding: '0 32px', borderBottom: '1px solid #e2e8f0',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: '0', zIndex: '20', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: '0'
    });
    
    // Hide native scrollbars on Webkit
    tabBar.innerHTML = `<style>#${safeId}-tabs::-webkit-scrollbar { display: none; }</style>`;
    tabBar.id = `${safeId}-tabs`;

    const tabNames = ['Function 1', 'Function 2', 'Function 3', 'Function 4', 'Function 5'];
    const tabElements = [];

    // ========================================================================
    // 5. FUNCTIONAL BLOCKS & CONTENT AREA
    // ========================================================================
    const contentArea = document.createElement('div');
    Object.assign(contentArea.style, {
        flex: '1', padding: '24px 32px 48px 32px', overflowY: 'auto', scrollBehavior: 'smooth',
        color: '#475569', fontSize: '15px', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '24px'
    });

    const blockElements = [];

    tabNames.forEach((name, index) => {
        // --- Create Functional Block (The Card) ---
        const block = document.createElement('div');
        block.id = `block-${index}`;
        Object.assign(block.style, {
            backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
        });

        const blockTitle = document.createElement('h2');
        blockTitle.innerText = name;
        Object.assign(blockTitle.style, { color: '#0f172a', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' });
        
        const blockContent = document.createElement('p');
        blockContent.innerText = `Input fields, dropdowns, and data for ${name} will be built here.`;
        Object.assign(blockContent.style, { margin: '0 0 16px 0', color: '#64748b' });

        const blockAction = document.createElement('button');
        blockAction.innerText = 'Update';
        Object.assign(blockAction.style, {
            alignSelf: 'flex-end', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1',
            borderRadius: '4px', padding: '6px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer'
        });
        blockAction.onmouseover = () => { blockAction.style.backgroundColor = '#e2e8f0'; };
        blockAction.onmouseout = () => { blockAction.style.backgroundColor = '#f1f5f9'; };

        block.appendChild(blockTitle);
        block.appendChild(blockContent);
        block.appendChild(blockAction);
        
        contentArea.appendChild(block);
        blockElements.push(block);

        // --- Create Tab Element ---
        const tab = document.createElement('div');
        tab.innerText = name;
        Object.assign(tab.style, {
            padding: '12px 0', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px',
            color: index === 0 ? '#0284c7' : '#64748b', 
            borderBottom: index === 0 ? '3px solid #0284c7' : '3px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.2s ease'
        });

        // Tab Click -> Scroll to Block
        tab.onclick = () => {
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Visual Update (Manual override on click)
            tabElements.forEach(t => { t.style.color = '#64748b'; t.style.borderBottomColor = 'transparent'; });
            tab.style.color = '#0284c7';
            tab.style.borderBottomColor = '#0284c7';
        };

        tabElements.push(tab);
        tabBar.appendChild(tab);
    });

    // Scroll-Spy Logic (Updates active tab when scrolling)
    contentArea.addEventListener('scroll', () => {
        let currentBlock = 0;
        const scrollPosition = contentArea.scrollTop;

        blockElements.forEach((block, index) => {
            // Check if the block is near the top of the scrollable area
            if (block.offsetTop - 300 <= scrollPosition) {
                currentBlock = index;
            }
        });

        tabElements.forEach((tab, index) => {
            if (index === currentBlock) {
                tab.style.color = '#0284c7';
                tab.style.borderBottomColor = '#0284c7';
            } else {
                tab.style.color = '#64748b';
                tab.style.borderBottomColor = 'transparent';
            }
        });
    });

    appCanvas.appendChild(headerArea);
    appCanvas.appendChild(tabBar);
    appCanvas.appendChild(contentArea);
    targetArea.appendChild(appCanvas);

    // ========================================================================
    // 6. EVENT HUB & OS SIGNAL ROUTING
    // ========================================================================
    
    // Listen for OS Signals broadcasted by windowmanager.js
    if (appWindow) {
        appWindow.addEventListener('tao-help-clicked', () => {
            console.log(`[${moduleName}] Help will be created.`);
            // Future integration: import(`./${safeId}-help.js`);
        });

        appWindow.addEventListener('tao-snapshot-clicked', () => {
            console.log(`[${moduleName}] Snapshot will be created.`);
            // Future integration: import(`./${safeId}-snapshot.js`);
        });
    }
}