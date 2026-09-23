/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/ad-bar.js
 * DESCRIPTION: Generates the top monetization bar with a battery-efficient 
 * interval rotation system (Load -> Pause -> Swap).
 * ============================================================================
 */

export function renderAdBar(height) {
    const adContainer = document.createElement('div');
    
    Object.assign(adContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: `${height}px`,
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: '49999', 
        pointerEvents: 'auto',
        overflow: 'hidden'
    });

    // The inner content layer that handles the fading animation
    const adContent = document.createElement('div');
    Object.assign(adContent.style, {
        transition: 'opacity 0.8s ease-in-out', // Hardware-accelerated fade
        opacity: '1',
        textAlign: 'center',
        width: '100%',
        cursor: 'pointer',
        padding: '0 20px',
        boxSizing: 'border-box'
    });

    adContainer.appendChild(adContent);

    // Simulated Ad Inventory (Text, Color, and Target URL)
    const adInventory = [
        { text: "🌟 UPGRADE TO PREMIUM: Remove ads & unlock Ultra AI.", color: "#fbbf24", link: "#premium" },
        { text: "ADVERTISEMENT: Sponsor Space Available", color: "#64748b", link: "#sponsor" },
        { text: "🚀 TAO OS PRO: 1TB Cloud Storage included. Click to upgrade.", color: "#38bdf8", link: "#pro" },
        { text: "ADVERTISEMENT: Global reach for your brand.", color: "#64748b", link: "#sponsor" }
    ];

    let currentIndex = 0;

    // Initialize the very first ad
    adContent.innerText = adInventory[0].text;
    adContent.style.color = adInventory[0].color;
    
    // Optional: Make the ad clickable
    adContent.onclick = () => {
        console.log(`[Ad System] User clicked ad routing to: ${adInventory[currentIndex].link}`);
    };

    // ==========================================
    // THE BATTERY-FRIENDLY ROTATION ENGINE
    // ==========================================
    // Rests at 0% CPU for 8 seconds, then efficiently swaps
    setInterval(() => {
        // 1. Fade out to black
        adContent.style.opacity = '0';
        
        // 2. Wait exactly as long as the CSS transition (800ms)
        setTimeout(() => {
            // Swap the content while it is invisible
            currentIndex = (currentIndex + 1) % adInventory.length;
            adContent.innerText = adInventory[currentIndex].text;
            adContent.style.color = adInventory[currentIndex].color;
            
            // 3. Fade back in
            adContent.style.opacity = '1';
        }, 800); 

    }, 8000); // 8000ms = 8 seconds of idle display time

    return adContainer; 
}