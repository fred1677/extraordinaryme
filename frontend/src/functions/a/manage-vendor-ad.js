/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/manage-vendor-ad.js
 * DESCRIPTION: Admin dashboard to Add, Update, and Delete ad vendors in the database.
 * ============================================================================
 */

export async function initAdManager(mountElement) {
    let editingAdId = null;

    const container = document.createElement('div');
    Object.assign(container.style, {
        padding: '20px', fontFamily: 'Arial, sans-serif', color: '#333',
        backgroundColor: '#f8fafc', width: '100%', height: '100%', overflowY: 'auto'
    });

    const title = document.createElement('h2');
    title.innerText = 'Vendor Ad Management';
    container.appendChild(title);

    // --- ADD / UPDATE VENDOR FORM ---
    const form = document.createElement('form');
    Object.assign(form.style, {
        display: 'flex', flexDirection: 'column', gap: '10px', 
        backgroundColor: '#fff', padding: '15px', border: '1px solid #cbd5e1', borderRadius: '4px',
        marginBottom: '20px'
    });

    form.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 id="form-title" style="margin: 0 0 10px 0;">Add New Vendor</h3>
            <button type="button" id="cancel-edit-btn" style="display: none; background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Cancel Edit</button>
        </div>
        <input type="text" id="ad-campaign" placeholder="Campaign Name (e.g., AWS Hosting)" required style="padding: 8px;">
        <input type="text" id="ad-headline" placeholder="Headline (Max 50 chars)" maxlength="50" required style="padding: 8px;">
        <input type="text" id="ad-subtext" placeholder="Subtext (Max 60 chars)" maxlength="60" required style="padding: 8px;">
        <input type="url" id="ad-url" placeholder="Target URL (Leave blank for 1-Page Internal Ad)" style="padding: 8px;">
        <textarea id="ad-internal-content" placeholder="1-Page Ad Content (If no URL provided)" style="padding: 8px; height: 80px;"></textarea>
        <div style="display: flex; gap: 10px;">
            <label>BG Color: <input type="color" id="ad-bg" value="#050505"></label>
            <label>Text Color: <input type="color" id="ad-text" value="#ffffff"></label>
        </div>
        <button type="submit" id="submit-ad-btn" style="padding: 10px; background: #000; color: #fff; border: none; cursor: pointer; font-weight: bold;">Save Vendor Ad</button>
    `;

    const resetForm = () => {
        form.reset();
        editingAdId = null;
        document.getElementById('form-title').innerText = 'Add New Vendor';
        document.getElementById('submit-ad-btn').innerText = 'Save Vendor Ad';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    };

    form.querySelector('#cancel-edit-btn').onclick = resetForm;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const targetUrl = document.getElementById('ad-url').value;
        
        const payload = {
            campaign: document.getElementById('ad-campaign').value,
            headline: document.getElementById('ad-headline').value,
            subtext: document.getElementById('ad-subtext').value,
            target_url: targetUrl || null,
            type: targetUrl ? 'external' : 'internal',
            internal_page_content: document.getElementById('ad-internal-content').value,
            bg_color: document.getElementById('ad-bg').value,
            text_color: document.getElementById('ad-text').value
        };

        const method = editingAdId ? 'PUT' : 'POST';
        const endpoint = editingAdId ? `/api/ads/${editingAdId}` : '/api/ads';

        await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        loadAds(); 
        resetForm();
    };

    container.appendChild(form);

    // --- VENDOR TABLE ---
    const tableContainer = document.createElement('div');
    container.appendChild(tableContainer);

    const loadAds = async () => {
        tableContainer.innerHTML = 'Loading vendors...';
        try {
            const response = await fetch('/api/ads');
            const ads = await response.json();
            
            if (ads.length === 0) {
                tableContainer.innerHTML = 'No active campaigns.';
                return;
            }

            let html = `<table style="width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #cbd5e1;">
                <tr style="background: #e2e8f0; text-align: left;">
                    <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Campaign</th>
                    <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Type</th>
                    <th style="padding: 10px; border-bottom: 1px solid #cbd5e1;">Actions</th>
                </tr>`;
            
            ads.forEach(ad => {
                // Store full object in data attribute for easy editing
                const adDataStr = encodeURIComponent(JSON.stringify(ad));
                html += `<tr>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1;">${ad.campaign}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 12px;">${ad.type}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #cbd5e1; display: flex; gap: 10px;">
                        <button class="edit-ad-btn" data-ad="${adDataStr}" style="color: #0284c7; cursor: pointer; background: none; border: none; font-weight: bold;">Edit</button>
                        <button class="delete-ad-btn" data-id="${ad.id}" style="color: red; cursor: pointer; background: none; border: none;">Remove</button>
                    </td>
                </tr>`;
            });
            html += `</table>`;
            tableContainer.innerHTML = html;

            // Bind Edit events
            tableContainer.querySelectorAll('.edit-ad-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const ad = JSON.parse(decodeURIComponent(e.target.getAttribute('data-ad')));
                    editingAdId = ad.id;
                    
                    document.getElementById('form-title').innerText = `Editing: ${ad.campaign}`;
                    document.getElementById('submit-ad-btn').innerText = 'Update Vendor Ad';
                    document.getElementById('cancel-edit-btn').style.display = 'block';

                    document.getElementById('ad-campaign').value = ad.campaign;
                    document.getElementById('ad-headline').value = ad.headline;
                    document.getElementById('ad-subtext').value = ad.subtext;
                    document.getElementById('ad-url').value = ad.target_url || '';
                    document.getElementById('ad-internal-content').value = ad.internal_page_content || '';
                    document.getElementById('ad-bg').value = ad.bg_color || '#050505';
                    document.getElementById('ad-text').value = ad.text_color || '#ffffff';
                    
                    form.scrollIntoView({ behavior: 'smooth' });
                };
            });

            // Bind Delete events
            tableContainer.querySelectorAll('.delete-ad-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const adId = e.target.getAttribute('data-id');
                    if (window.confirm('Permanently remove this vendor?')) {
                        await fetch(`/api/ads/${adId}`, { method: 'DELETE' });
                        if (editingAdId == adId) resetForm(); // Clear form if deleting the currently edited ad
                        loadAds();
                    }
                };
            });
        } catch (err) {
            tableContainer.innerHTML = 'Failed to load database inventory.';
        }
    };

    loadAds();
    mountElement.appendChild(container);
}