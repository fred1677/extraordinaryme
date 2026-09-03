// src/components/buttons.js

const THEMES = {
    primary: 'background: #4f46e5; color: #ffffff; border: none;',
    secondary: 'background: #1f2937; color: #e5e7eb; border: 1px solid #374151;',
    danger: 'background: #7f1d1d; color: #fca5a5; border: none;',
    dangerLight: 'background: #ffe4e6; color: #e11d48; border: none;',
    accent: 'background: #3730a3; color: #c7d2fe; border: none;',
    ghost: 'background: transparent; border: none; color: #818cf8;'
};

const SIZES = {
    sm: 'padding: 0.35rem 0.65rem; font-size: 0.8rem; border-radius: 6px;',
    md: 'padding: 0.55rem 1.1rem; font-size: 0.9rem; border-radius: 8px;',
    lg: 'padding: 0.75rem 1.25rem; font-size: 1rem; border-radius: 8px;'
};

export function createButton({ id = '', text, variant = 'primary', size = 'md', extraStyle = '', type = 'button' }) {
    const base = 'cursor: pointer; font-weight: 600; transition: opacity 0.15s ease; display: inline-flex; align-items: center; gap: 0.4rem; font-family: inherit;';
    const variantStyle = THEMES[variant] || THEMES.primary;
    const sizeStyle = SIZES[size] || SIZES.md;

    return `
        <button type="${type}" ${id ? `id="${id}"` : ''} style="${base} ${sizeStyle} ${variantStyle} ${extraStyle}">
            ${text}
        </button>
    `;
}

export function createNavLink({ href, text, variant = 'secondary', size = 'md', id = '', extraStyle = '' }) {
    const base = 'cursor: pointer; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; font-family: inherit;';
    const variantStyle = THEMES[variant] || THEMES.secondary;
    const sizeStyle = SIZES[size] || SIZES.md;

    return `
        <a href="${href}" ${id ? `id="${id}"` : ''} style="${base} ${sizeStyle} ${variantStyle} ${extraStyle}">
            ${text}
        </a>
    `;
}

// Pre-configured standard platform actions
export const StandardButtons = {
    help: (id = 'nav-help-link') => createNavLink({ href: '#help', text: '❓ Help', variant: 'secondary', size: 'md', id }),
    admin: (id = 'nav-admin-link') => createNavLink({ href: '#admin', text: '⚙️ Admin Console', variant: 'accent', size: 'md', id }),
    backHome: () => createNavLink({ href: '#home', text: '← Back to App', variant: 'secondary', size: 'md' }),
    logout: (id = 'logout-btn') => createButton({ id, text: 'Log Out', variant: 'dangerLight', size: 'md' }),
    sectionInfo: (topicKey) => `
        <button class="section-help-btn" data-topic="${topicKey}" style="background:none; border:none; font-size:1.1rem; cursor:pointer; color:#818cf8; padding:0.2rem;" title="Section Guidance">
            ℹ️
        </button>
    `
};