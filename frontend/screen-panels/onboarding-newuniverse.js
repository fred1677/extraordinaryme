// File: /frontend/screen-panels/onboarding-newuniverse.js

import { renderHomeScreen } from './home-screen.js';
import { renderHelp } from '../help/help-main.js';

export function renderOnboarding(targetElement, mode = 'initial_signup') {
    // 1. Reset Canvas and Inject Cosmic CSS
    targetElement.innerHTML = '';
    targetElement.style.margin = '0';
    targetElement.style.height = '100dvh';
    targetElement.style.backgroundColor = '#000000';
    targetElement.style.display = 'flex';
    targetElement.style.alignItems = 'center';
    targetElement.style.justifyContent = 'center';

    const style = document.createElement('style');
    style.textContent = `
        .onboarding-shell { display: flex; flex-direction: column; align-items: center; gap: 30px; text-align: center; color: #ffffff; font-family: monospace; z-index: 10; max-width: 400px; width: 90%; }
        
        .fire-orb { width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #ff4d4d, #990000, #000000); box-shadow: 0 0 40px #ff0000, inset 0 0 20px #ff9999; animation: pulse 2s infinite alternate; display: flex; justify-content: center; align-items: center; font-size: 40px; font-weight: 900; }
        @keyframes pulse { 0% { box-shadow: 0 0 30px #dc2626; transform: scale(1); } 100% { box-shadow: 0 0 60px #ef4444; transform: scale(1.05); } }

        .ob-title { font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .ob-desc { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }

        .ob-input { width: 100%; padding: 15px; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; border-radius: 8px; color: #ffffff; font-family: monospace; font-size: 16px; box-sizing: border-box; outline: none; transition: border-color 0.3s; margin-bottom: 15px; }
        .ob-input:focus { border-color: #ef4444; }
        textarea.ob-input { resize: vertical; min-height: 80px; }

        .ob-btn { width: 100%; padding: 15px; background: #dc2626; color: #ffffff; border: none; border-radius: 8px; font-family: monospace; font-size: 16px; font-weight: bold; cursor: pointer; text-transform: uppercase; transition: background 0.3s, transform 0.1s; margin-top: 10px; }
        .ob-btn:hover { background: #ef4444; }
        .ob-btn:active { transform: scale(0.98); }
    `;
    document.head.appendChild(style);

    const shell = document.createElement('div');
    shell.className = 'onboarding-shell';

    // 2. Render UI Based on the 'mode' Parameter
    if (mode === 'initial_signup') {
        shell.innerHTML = `
            <div class="fire-orb">!</div>
            <div>
                <h1 class="ob-title">Awaken</h1>
                <p class="ob-desc">You are entering the TAO origin system.</p>
            </div>
            <input type="text" id="user-name" class="ob-input" placeholder="Enter your designation (Name)" autocomplete="off" />
            <button class="ob-btn" id="submit-btn">Initialize Connection</button>
        `;
    } else if (mode === 'create_universe') {
        shell.innerHTML = `
            <div class="fire-orb" style="background: radial-gradient(circle at 30% 30%, #3b82f6, #1d4ed8, #000000); box-shadow: 0 0 40px #2563eb, inset 0 0 20px #93c5fd;">+</div>
            <div>
                <h1 class="ob-title">Forge Universe</h1>
                <p class="ob-desc">Define the parameters of your new workspace.</p>
            </div>
            <input type="text" id="uni-name" class="ob-input" placeholder="Universe Name (e.g., FINANCE)" autocomplete="off" />
            <textarea id="uni-desc" class="ob-input" placeholder="Universe Description"></textarea>
            <input type="text" id="uni-color" class="ob-input" placeholder="Orb Design (Hex Color)" value="#3b82f6" autocomplete="off" />
            <button class="ob-btn" id="submit-btn" style="background: #2563eb;">Ignite Core</button>
        `;
    }

    targetElement.appendChild(shell);

    // 3. Bind the Dual-Routing Logic
    document.getElementById('submit-btn').addEventListener('click', async () => {
        
        if (mode === 'initial_signup') {
            const name = document.getElementById('user-name').value.trim();
            if (!name) return alert('Designation required.');
            
            console.log(`Creating user: ${name}`);
            
            // >>> SPA HANDOFF: Render immutable Yellow TAO Hub instantly <<<
            await renderHomeScreen(targetElement, 'TAO'); 
            
            // Trigger the Tour Overlay for the brand new user
            setTimeout(() => {
                renderHelp();
            }, 100);
            
        } else if (mode === 'create_universe') {
            const name = document.getElementById('uni-name').value.trim();
            const desc = document.getElementById('uni-desc').value.trim();
            const color = document.getElementById('uni-color').value.trim();
            
            if (!name) return alert('Universe Name required.');

            console.log(`Forging Universe: ${name}, ${desc}, ${color}`);
            
            // Pass the custom name so the Home Screen displays it dynamically
            await renderHomeScreen(targetElement, name);
            
            // NO HELP TOUR! They just dive straight into their new universe.
        }
    });
}