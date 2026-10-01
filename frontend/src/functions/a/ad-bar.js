/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/ad-bar.js
 * DESCRIPTION: Generates the top monetization bar with a battery-efficient 
 * interval rotation system (Load -> Pause -> Swap).
 * ============================================================================
 */

export function renderAdBar(height) {
    // 🚀 STRICT ANTI-GHOSTING: Annihilate any leftover ad bars and timers from hot-reloads
    document.querySelectorAll('#tao-ad-bar, .tao-ad-container').forEach(el => el.remove());
    if (window.TAO_AD_INTERVAL) clearInterval(window.TAO_AD_INTERVAL);

    const adContainer = document.createElement('div');
    adContainer.id = 'tao-ad-bar';
    adContainer.className = 'tao-ad-container';
    
    Object.assign(adContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '49999', 
        pointerEvents: 'auto',
        overflow: 'hidden',
        boxSizing: 'border-box'
    });

    const adContent = document.createElement('div');
    Object.assign(adContent.style, {
        transition: 'opacity 0.6s ease-in-out', 
        opacity: '1',
        textAlign: 'center',
        width: '100%',
        cursor: 'pointer',
        padding: '0 16px', 
        boxSizing: 'border-box',
        // 🚀 TYPOGRAPHY LOCK: Gracefully handles wrapping text on narrow mobile screens
        fontFamily: 'monospace',
        fontSize: '11px', 
        lineHeight: '1.4',
        display: '-webkit-box',
        WebkitLineClamp: '2',          // Forces text to max 2 lines
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    });

    adContainer.appendChild(adContent);

    // Simulated Ad Inventory
    const adInventory = [
        { text: "🌟 UPGRADE TO PREMIUM: Remove ads & unlock Ultra AI.", color: "#fbbf24", link: "#premium" },
        { text: "ADVERTISEMENT: Sponsor Space Available", color: "#64748b", link: "#sponsor" },
        { text: "🚀 TAO OS PRO: 1TB Cloud Storage included. Click to upgrade.", color: "#38bdf8", link: "#pro" },
        { text: "ADVERTISEMENT: Global reach for your brand.", color: "#64748b", link: "#sponsor" }
    ];

    let currentIndex = 0;

    adContent.innerText = adInventory[0].text;
    adContent.style.color = adInventory[0].color;
    
    adContent.onclick = () => {
        console.log(`[Ad System] User clicked ad routing to: ${adInventory[currentIndex].link}`);
    };

    // ==========================================
    // THE BATTERY-FRIENDLY ROTATION ENGINE
    // ==========================================
    window.TAO_AD_INTERVAL = setInterval(() => {
        adContent.style.opacity = '0';
        
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % adInventory.length;
            adContent.innerText = adInventory[currentIndex].text;
            adContent.style.color = adInventory[currentIndex].color;
            
            adContent.style.opacity = '1';
        }, 600); 

    }, 8000); 

    return adContainer; 
}