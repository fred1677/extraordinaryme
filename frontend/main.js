import { AppBootstrap } from './bootstrap.js';
import { renderLoginPanel } from './login.js';
import { runBigBang } from './onboarding/onboarding.js';
import { loadHomePage } from './home/home-page.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Global Sizing & Voice Manager
    AppBootstrap.init('desktop');
    
    const rootElement = document.getElementById('root');
    
    // 2. Routing Logic: Check if the user is returning
    const returningUserId = localStorage.getItem('tao_user_id');

    if (returningUserId) {
        // Returning User: Skip Login and Big Bang, go straight to Main Panel
        console.log(`[Router] Returning user detected: ${returningUserId}`);
        loadHomePage(rootElement);
    } else {
        // New User: Show Login Panel
        console.log('[Router] New user detected. Loading login/registration.');
        renderLoginPanel(rootElement, {}, (newUserId) => {
            
            // 3. Post-Login Handoff: Ignite Big Bang for the new user
            runBigBang(rootElement, () => {
                
                // 4. Final Handoff: Clean the void and load the Home Universe
                rootElement.innerHTML = ''; 
                loadHomePage(rootElement);
            });
            
        });
    }
});
