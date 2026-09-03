// src/router.js

const routes = {
    'login': () => import('./views/login.js'),
    'home': () => import('./views/home.js'),
    'onboarding': () => import('./views/onboarding.js'),
    'awakening': () => import('./views/awakening.js')
};

let currentView = null;

export async function navigate() {
    const rawHash = window.location.hash.slice(1);
    const hasToken = !!localStorage.getItem('auth_token');
    
    // Fallback logic: if route doesn't exist, go to home (if logged in) or login
    const route = routes[rawHash] ? rawHash : (hasToken ? 'home' : 'login');

    // Auth Guard
    if (route !== 'login' && !hasToken) {
        window.location.hash = '#login';
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