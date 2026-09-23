/**
 * ============================================================================
 * MODULE: /frontend/help/help-main.js
 * DESCRIPTION: The global help interface and tutorial overlay. 
 * Executed directly after the cinematic onboarding for new users.
 * ============================================================================
 */

export async function initHelpMain() {
    return new Promise((resolve) => {
        const root = document.getElementById('tao-os-root') || document.body;
        
        // 1. Construct the Help UI Overlay (Layer 6 Override)
        const helpLayer = document.createElement('div');
        Object.assign(helpLayer.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Courier New, monospace', color: '#00ff41',
            zIndex: '999999', opacity: '0', transition: 'opacity 1s ease',
            pointerEvents: 'auto' // Ensures the layer itself can receive interactions
        });

        helpLayer.innerHTML = `
            <div style="max-width: 600px; text-align: center; line-height: 1.6; padding: 40px; border: 1px solid #334155; border-radius: 8px; background: rgba(15, 23, 42, 0.8);">
                <h2 style="margin-top: 0; color: #fff; text-transform: uppercase; letter-spacing: 2px;">System Guide</h2>
                <p style="font-size: 16px; margin-bottom: 40px; color: #94a3b8;">
                    This is the main help section to be developed...
                </p>
                <button id="help-proceed-btn" style="
                    pointer-events: auto;
                    background-color: #ef4444; 
                    color: #ffffff;
                    border: 2px solid #b91c1c;
                    padding: 15px 60px;
                    font-size: 20px;
                    font-family: monospace;
                    font-weight: bold;
                    cursor: pointer;
                    border-radius: 8px;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
                    outline: none;
                    -webkit-appearance: none;
                ">PROCEED</button>
            </div>
        `;

        root.appendChild(helpLayer);

        // 2. Fade in UI and Trigger Voice Announcement
        setTimeout(() => {
            helpLayer.style.opacity = '1';
            
            // Utilize the previously unlocked audio engine
            if (window.TAO_CORE && window.TAO_CORE.voice) {
                window.TAO_CORE.voice.speak("This is the main help section to be developed.");
            }
        }, 100);

        // 3. Await User Acknowledgment to Resolve Sequence (Strictly Tap/Click)
        const proceedBtn = document.getElementById('help-proceed-btn');
        proceedBtn.onclick = () => {
            // Fade out and self-destruct
            helpLayer.style.opacity = '0';
            setTimeout(() => {
                helpLayer.remove();
                resolve(); // Handoff back to index.js
            }, 1000);
        };
    });
}