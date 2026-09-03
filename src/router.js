// src/router.js

const routes = {
    'login': () => import('./views/login.js'),
    'register': () => import('./views/register.js'),
    'home': () => import('./views/home.js'),
    'onboarding': () => import('./views/onboarding.js'),
    'awakening': () => import('./views/awakening.js')
};

let currentView = null;

// Ensure persistent top-right Log Off tab on all authenticated views
function updateGlobalAuthHeader(hasToken) {
    let bar = document.getElementById('global-auth-bar');

    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'global-auth-bar';
        bar.style.cssText = `
            position: fixed;
            top: max(1.25rem, env(safe-area-inset-top, 1.25rem));
            right: max(1.75rem, env(safe-area-inset-right, 1.75rem));
            z-index: 10000;
            display: flex;
            align-items: center;
        `;
        document.body.appendChild(bar);
    }

    if (hasToken) {
        bar.innerHTML = `
            <button id="btn-global-logoff" style="
                background: rgba(30, 41, 59, 0.85);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                color: #f87171;
                border: 1px solid rgba(248, 113, 113, 0.3);
                padding: 0.5rem 0.95rem;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 0.4rem;
                touch-action: manipulation;
                transition: background 0.2s ease, transform 0.1s ease;">
                🚪 Log off
            </button>
        `;

        const logoffBtn = document.getElementById('btn-global-logoff');
        if (logoffBtn) {
            logoffBtn.onclick = (e) => {
                e.preventDefault();

                // Save exact location prior to logout
                const currentHash = window.location.hash.slice(1);
                if (currentHash && currentHash !== 'login' && currentHash !== 'register') {
                    localStorage.setItem('last_visited_route', currentHash);
                }

                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('auth_user');
                updateGlobalAuthHeader(false);
                window.location.hash = '#login';
            };
        }
    } else {
        bar.innerHTML = '';
    }
}

export async function navigate() {
    const rawHash = window.location.hash.slice(1);
    const hasToken = !!localStorage.getItem('auth_token');
    
    // Manage persistent top-right logoff tab immediately
    updateGlobalAuthHeader(hasToken);

    // Save active route state for seamless post-return restoration
    if (rawHash && rawHash !== 'login' && rawHash !== 'register') {
        localStorage.setItem('last_visited_route', rawHash);
    }

    // Determine target route
    let route;
    if (routes[rawHash]) {
        route = rawHash;
    } else if (hasToken) {
        // Return to exact previous location if available, otherwise default to home
        route = localStorage.getItem('last_visited_route') || 'home';
    } else {
        route = 'login';
    }

    // Auth Guard: Public routes allowed without token
    const publicRoutes = ['login', 'register'];
    if (!publicRoutes.includes(route) && !hasToken) {
        // Stash requested route before bouncing to login
        if (rawHash && !publicRoutes.includes(rawHash)) {
            localStorage.setItem('last_visited_route', rawHash);
        }
        window.location.hash = '#login';
        return;
    }

    // If user is already authenticated and attempts to access login or register
    if (publicRoutes.includes(route) && hasToken) {
        const returnRoute = localStorage.getItem('last_visited_route') || 'home';
        window.location.hash = `#${returnRoute}`;
        return;
    }

    if (currentView && typeof currentView.cleanup === 'function') {
        currentView.cleanup();
    }

    const app = document.getElementById('app');
    if (!app) {
        console.error('Root element #app not found in index.html');
        return;
    }

    try {
        const viewModule = await routes[route]();
        currentView = viewModule;

        app.innerHTML = viewModule.render();
        if (typeof viewModule.init === 'function') {
            viewModule.init();
        }
    } catch (err) {
        console.error(`Failed to load view for route "${route}":`, err);
        app.innerHTML = `
            <div style="padding: 2rem; color: #dc2626; font-family: sans-serif;">
                <h3>View Render Error</h3>
                <pre>${err.stack || err.message}</pre>
            </div>
        `;
    }
}

// Global router event listeners
window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    navigate();
}

export const initRouter = navigate;