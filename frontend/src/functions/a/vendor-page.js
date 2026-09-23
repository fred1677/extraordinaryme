/**
 * ============================================================================
 * MODULE: /frontend/src/functions/a/vendor-page.js
 * DESCRIPTION: Generates an internal 1-page ad popup for vendors without external URLs.
 * ============================================================================
 */

export function launchVendorPage(adData) {
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '60000' // Above UI Chrome
    });

    const pageContainer = document.createElement('div');
    Object.assign(pageContainer.style, {
        width: '80%', maxWidth: '600px', backgroundColor: adData.bg_color || '#ffffff',
        color: adData.text_color || '#000000', padding: '40px', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', position: 'relative', fontFamily: 'Arial, sans-serif'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = '✕ Close';
    Object.assign(closeBtn.style, {
        position: 'absolute', top: '15px', right: '15px', background: 'transparent',
        border: 'none', color: adData.text_color || '#000', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold'
    });
    closeBtn.onclick = () => modalOverlay.remove();

    const title = document.createElement('h1');
    title.innerText = adData.headline;
    title.style.marginBottom = '20px';

    const content = document.createElement('div');
    content.innerHTML = adData.internal_page_content || 'Discover more about our services.';
    content.style.lineHeight = '1.6';

    pageContainer.appendChild(closeBtn);
    pageContainer.appendChild(title);
    pageContainer.appendChild(content);
    modalOverlay.appendChild(pageContainer);

    document.body.appendChild(modalOverlay);
}