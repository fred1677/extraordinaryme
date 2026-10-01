/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/manage-vendor-ad.js
 * DESCRIPTION: Self-serve portal to Add and Manage Advertisements.
 * ============================================================================
 */

console.log('[Ad Manager] Module successfully imported by OS.');

export async function initAdManager(mountElement) {
    console.log('[Ad Manager] Execution started.');

    // 🚀 SAFETY FALLBACK: If the OS generic launcher doesn't pass the container, find it
    if (!mountElement) {
        const activeWin = document.querySelector('.tao-workspace-window:last-child');
        mountElement = activeWin ? (activeWin.querySelector('.tao-window-content') || activeWin) : document.body;
    }

    // Clear out any previous content
    mountElement.innerHTML = '';

    const container = document.createElement('div');
    Object.assign(container.style, {
        padding: '24px', fontFamily: 'sans-serif', color: '#1e293b',
        backgroundColor: '#f8fafc', width: '100%', height: '100%', 
        overflowY: 'auto', boxSizing: 'border-box'
    });

    const header = document.createElement('h2');
    header.innerText = 'Ad Campaign Manager';
    header.style.marginTop = '0';
    container.appendChild(header);

    // ==========================================
    // THE AD CREATION FORM
    // ==========================================
    const form = document.createElement('form');
    Object.assign(form.style, {
        display: 'flex', flexDirection: 'column', gap: '16px', 
        backgroundColor: '#ffffff', padding: '20px', 
        border: '1px solid #e2e8f0', borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '24px'
    });

    form.innerHTML = `
        <h3 style="margin: 0; font-size: 16px; color: #0f172a;">Create New Advertisement</h3>
        
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 12px; font-weight: bold; color: #64748b;">Campaign / Advertiser Name</label>
            <input type="text" id="ad-campaign" placeholder="e.g., Classic Watch Case Co." required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 12px; font-weight: bold; color: #64748b;">Ad Display Text</label>
            <input type="text" id="ad-text" placeholder="e.g., ⌚ Shop premium watch cases made in the USA." required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 12px; font-weight: bold; color: #64748b;">Target Website (Optional)</label>
            <input type="url" id="ad-url" placeholder="e.g., https://cwccousa.com" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px;">
            <span style="font-size: 11px; color: #94a3b8;">If provided, clicking the ad will open this website.</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 4px;">
            <label style="font-size: 12px; font-weight: bold; color: #64748b;">Internal Page Content (If no website exists)</label>
            <textarea id="ad-internal-content" placeholder="Type the HTML or text for their custom landing page here..." style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 4px; height: 100px; resize: vertical;"></textarea>
        </div>

        <div style="display: flex; gap: 20px;">
            <label style="font-size: 12px; font-weight: bold; color: #64748b; display: flex; align-items: center; gap: 8px;">
                Background Color: <input type="color" id="ad-bg" value="#0f172a" style="cursor: pointer;">
            </label>
            <label style="font-size: 12px; font-weight: bold; color: #64748b; display: flex; align-items: center; gap: 8px;">
                Text Color: <input type="color" id="ad-text-color" value="#38bdf8" style="cursor: pointer;">
            </label>
        </div>

        <button type="submit" id="submit-ad-btn" style="padding: 12px; background: #0ea5e9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; margin-top: 8px;">
            Publish Advertisement
        </button>
    `;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-ad-btn');
        submitBtn.innerText = 'Publishing...';
        submitBtn.style.background = '#94a3b8';

        const targetUrl = document.getElementById('ad-url').value;
        
        const payload = {
            campaign: document.getElementById('ad-campaign').value,
            text: document.getElementById('ad-text').value,
            link: targetUrl || 'internal-page',
            type: targetUrl ? 'external' : 'internal',
            internal_content: document.getElementById('ad-internal-content').value,
            backgroundColor: document.getElementById('ad-bg').value,
            color: document.getElementById('ad-text-color').value
        };

        try {
            // Pushes the ad to your PostgreSQL backend via your API
            const response = await fetch('/api/ads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                form.reset();
                
                // Show a green success confirmation on the button
                submitBtn.innerText = '✅ Ad Saved Successfully!';
                submitBtn.style.background = '#10b981'; 
                
                // Reset the button back to default after 3 seconds
                setTimeout(() => {
                    submitBtn.innerText = 'Publish Advertisement';
                    submitBtn.style.background = '#0ea5e9';
                }, 3000);

                loadAds(); // Refresh the list below
            } else {
                throw new Error('Failed to save to database');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving ad. Ensure backend /api/ads route is active.');
            submitBtn.innerText = 'Publish Advertisement';
            submitBtn.style.background = '#0ea5e9';
        }
    };

    container.appendChild(form);

    // ==========================================
    // THE ACTIVE ADS TABLE
    // ==========================================
    const tableContainer = document.createElement('div');
    container.appendChild(tableContainer);

    const loadAds = async () => {
        tableContainer.innerHTML = '<p style="color: #64748b; font-size: 14px;">Loading active campaigns...</p>';
        try {
            const response = await fetch('/api/ads');
            if (!response.ok) throw new Error('API not reachable');
            
            const ads = await response.json();
            
            if (ads.length === 0) {
                tableContainer.innerHTML = '<p style="color: #64748b; font-size: 14px;">No active campaigns in database.</p>';
                return;
            }

            let html = `
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a;">Active Ad Inventory</h3>
            <table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background: #f1f5f9; text-align: left; font-size: 12px; color: #475569;">
                    <th style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Campaign</th>
                    <th style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Type</th>
                    <th style="padding: 12px; border-bottom: 1px solid #e2e8f0;">Actions</th>
                </tr>`;
            
            ads.forEach(ad => {
                html += `
                <tr style="font-size: 13px;">
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${ad.campaign}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                        <span style="background: ${ad.type === 'external' ? '#dcfce7' : '#e0e7ff'}; color: ${ad.type === 'external' ? '#166534' : '#3730a3'}; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">
                            ${ad.type}
                        </span>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
                        <button class="delete-ad-btn" data-id="${ad.id}" style="color: #ef4444; cursor: pointer; background: none; border: none; font-weight: bold;">Delete</button>
                    </td>
                </tr>`;
            });
            html += `</table>`;
            tableContainer.innerHTML = html;

            tableContainer.querySelectorAll('.delete-ad-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const adId = e.target.getAttribute('data-id');
                    if (window.confirm('Stop running this ad?')) {
                        await fetch(`/api/ads/${adId}`, { method: 'DELETE' });
                        loadAds();
                    }
                };
            });
        } catch (err) {
            tableContainer.innerHTML = `
                <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 16px; border-radius: 8px; color: #991b1b;">
                    <strong>Database Connection Required:</strong><br> 
                    The frontend App is ready, but it cannot reach the backend API (<code>/api/ads</code>) to save data to PostgreSQL.
                </div>`;
        }
    };

    loadAds();
    mountElement.appendChild(container);
}

// 🚀 BULLETPROOF OS EXPORTS: Ensure any generic desktop launcher can execute this file
export default initAdManager;
export { initAdManager as init, initAdManager as mount };