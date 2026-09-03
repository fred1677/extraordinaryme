// src/components/mediaPicker.js

/**
 * Reusable Media Attachment Component
 * Supports: Local Images, Documents (PDF/TXT), Video files, and External URLs
 */
export function createMediaPicker(containerId, onMediaChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let items = [];

    function renderUI() {
        container.innerHTML = `
            <div style="margin-top: 1rem; padding: 1rem; background: #0b0f19; border: 1px dashed #334155; border-radius: 10px;">
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
                    <span style="font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase;">Attach Origin Artifact:</span>
                    
                    <label style="cursor: pointer; background: #1e293b; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.8rem; color: #cbd5e1; border: 1px solid #334155;">
                        📷 Image <input type="file" accept="image/*" class="media-file-input" data-type="image" style="display: none;">
                    </label>
                    <label style="cursor: pointer; background: #1e293b; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.8rem; color: #cbd5e1; border: 1px solid #334155;">
                        📄 Doc <input type="file" accept=".pdf,.doc,.docx,.txt" class="media-file-input" data-type="document" style="display: none;">
                    </label>
                    <label style="cursor: pointer; background: #1e293b; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.8rem; color: #cbd5e1; border: 1px solid #334155;">
                        🎥 Video <input type="file" accept="video/*" class="media-file-input" data-type="video" style="display: none;">
                    </label>
                    <button type="button" id="${containerId}-link-btn" style="cursor: pointer; background: #1e293b; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.8rem; color: #cbd5e1; border: 1px solid #334155;">
                        🔗 Add Link
                    </button>
                </div>

                <!-- Preview Area -->
                <div id="${containerId}-preview" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>
        `;

        bindEvents();
        updatePreview();
    }

    function bindEvents() {
        const fileInputs = container.querySelectorAll('.media-file-input');
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    items.push({
                        type: input.dataset.type,
                        name: file.name,
                        data: event.target.result
                    });
                    updatePreview();
                };
                reader.readAsDataURL(file);
            });
        });

        const linkBtn = container.querySelector(`#${containerId}-link-btn`);
        if (linkBtn) {
            linkBtn.addEventListener('click', () => {
                const url = prompt('Enter media or reference URL:');
                if (url) {
                    items.push({
                        type: 'link',
                        name: url,
                        data: url
                    });
                    updatePreview();
                }
            });
        }
    }

    function updatePreview() {
        const previewBox = container.querySelector(`#${containerId}-preview`);
        if (!previewBox) return;

        previewBox.innerHTML = items.map((item, idx) => {
            if (item.type === 'image') {
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 0.5rem; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <img src="${item.data}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px;" alt="preview" />
                            <span style="font-size: 0.85rem; color: #e2e8f0;">${item.name}</span>
                        </div>
                        <button type="button" class="del-media-btn" data-idx="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
                    </div>
                `;
            } else if (item.type === 'video') {
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 0.5rem; border-radius: 6px;">
                        <span style="font-size: 0.85rem; color: #e2e8f0;">🎥 ${item.name}</span>
                        <button type="button" class="del-media-btn" data-idx="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
                    </div>
                `;
            } else {
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 0.5rem; border-radius: 6px;">
                        <span style="font-size: 0.85rem; color: #60a5fa;">📎 <a href="${item.data}" target="_blank" style="color: #60a5fa; text-decoration: underline;">${item.name}</a></span>
                        <button type="button" class="del-media-btn" data-idx="${idx}" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
                    </div>
                `;
            }
        }).join('');

        previewBox.querySelectorAll('.del-media-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const i = parseInt(e.target.dataset.idx, 10);
                items.splice(i, 1);
                updatePreview();
            });
        });

        if (typeof onMediaChange === 'function') {
            onMediaChange(items);
        }
    }

    renderUI();

    return {
        getItems: () => items,
        setItems: (newItems) => {
            items = newItems || [];
            updatePreview();
        }
    };
}