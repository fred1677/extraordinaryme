import { renderMainPanel } from '../screen-panels/main-panel.js';

export function loadHomePage(targetElement) {
    // 1. Render the Empty UI Shell (The Presenter)
    // We pass 'TAO' as the universe since this is the root home page
    renderMainPanel(targetElement, { 
        universeName: 'TAO',
        showChatbox: true
    });

    // 2. Target the newly created sections
    const leftDrawer = document.getElementById('drawer-left');
    const rightDrawer = document.getElementById('drawer-right');
    const mainCanvas = document.getElementById('main-canvas');

    // 3. Inject the "READY" states and Orbs
    const readyTemplate = `
        <div style="padding: 40px 20px; color: #10b981; font-family: monospace; text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: #0f172a; border: 2px solid #10b981; margin-bottom: 20px; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);"></div>
            <p>READY for your homepage</p>
        </div>
    `;

    if (leftDrawer) leftDrawer.innerHTML = readyTemplate;
    if (rightDrawer) rightDrawer.innerHTML = readyTemplate;

    if (mainCanvas) {
        mainCanvas.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #10b981; font-family: monospace;">
                <div style="width: 100px; height: 100px; border-radius: 50%; background: radial-gradient(circle, #ffd700 0%, #b8860b 100%); margin-bottom: 30px; box-shadow: 0 0 40px rgba(255, 215, 0, 0.4);"></div>
                <h2 style="font-size: 24px; letter-spacing: 2px;">READY FOR YOUR HOMEPAGE</h2>
                <p style="color: #64748b; margin-top: 15px;">Welcome to the TAO Universe.</p>
            </div>
        `;
    }
}
