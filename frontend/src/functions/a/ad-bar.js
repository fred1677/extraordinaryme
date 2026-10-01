/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/ad-bar.js
 * DESCRIPTION: Generates the top monetization bar with a battery-efficient 
 * interval rotation system, pulling live inventory from PostgreSQL.
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

    let adInventory = [];
    let currentIndex = 0;

    // Default loading state
    adContent.innerText = "Loading active promotions...";
    adContent.style.color = "#64748b";

    const updateAdVisuals = () => {
        if (adInventory.length === 0) return;
        const currentAd = adInventory[currentIndex];
        
        // Maps the backend database fields to your frontend visuals
        adContent.innerText = currentAd.text || currentAd.headline || "Advertisement";
        adContent.style.color = currentAd.color || currentAd.text_color || "#fbbf24";
        adContainer.style.backgroundColor = currentAd.backgroundColor || currentAd.bg_color || "#0f172a";
    };
    
    adContent.onclick = () => {
        if (adInventory.length === 0) return;
        const currentAd = adInventory[currentIndex];
        const targetUrl = currentAd.link || currentAd.target_url;
        
        console.log(`[Ad System] User clicked ad routing to: ${targetUrl || 'internal'}`);
        
        if (currentAd.type === 'external' && targetUrl) {
            window.open(targetUrl, '_blank');
        } else {
            console.log(`[Ad System] Triggering internal OS page for: ${currentAd.campaign}`);
            // Future-proofing: Call your 1-page internal vendor pop-up here
        }
    };

    // 🚀 FETCH LIVE ADS FROM POSTGRESQL DATABASE
    fetch('/api/ads')
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                adInventory = data;
                updateAdVisuals();

                // ==========================================
                // THE BATTERY-FRIENDLY ROTATION ENGINE
                // ==========================================
                if (adInventory.length > 1) {
                    window.TAO_AD_INTERVAL = setInterval(() => {
                        adContent.style.opacity = '0';
                        
                        setTimeout(() => {
                            currentIndex = (currentIndex + 1) % adInventory.length;
                            updateAdVisuals();
                            adContent.style.opacity = '1';
                        }, 600); 

                    }, 8000); 
                }
            } else {
                // Original fallback if the database is empty
                adContent.innerText = "🌟 UPGRADE TO PREMIUM: Remove ads & unlock Ultra AI.";
                adContent.style.color = "#fbbf24";
            }
        })
        .catch(err => {
            console.error('[Ad System] Failed to load database inventory:', err);
            // Original fallback if the database connection fails
            adContent.innerText = "🌟 UPGRADE TO PREMIUM: Remove ads & unlock Ultra AI.";
            adContent.style.color = "#fbbf24";
        });

    return adContainer; 
}