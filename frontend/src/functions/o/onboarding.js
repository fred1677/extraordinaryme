/**
 * ============================================================================
 * MODULE: /frontend/src/functions/o/onboarding.js
 * DESCRIPTION: Cinematic new-user welcome sequence. (Canvas Burst + Freeze)
 * ============================================================================
 */

export async function initOnboarding() {
    return new Promise(async (resolve) => {
        const root = document.getElementById('tao-os-root') || document.body;
        const sandboxConsole = document.getElementById('sandbox-console');
        
        // Helper: Async sleep timer for cinematic sequencing
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        // Ensure AudioContext is initialized
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playHeartbeat = () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        };

        // ==========================================
        // PHASE 1: THE BLACK HOLE SUCK
        // ==========================================
        if (sandboxConsole) {
            sandboxConsole.style.transition = 'all 2.5s cubic-bezier(0.5, 0, 0.5, 1)';
            sandboxConsole.style.transform = 'translate(50vw, 50vh) scale(0) rotate(1080deg)';
            sandboxConsole.style.transformOrigin = 'center';
            sandboxConsole.style.opacity = '0';
            sandboxConsole.style.filter = 'blur(20px)';
        }
        await sleep(2600);

        // ==========================================
        // PHASE 2: THE WHITE DOT & HEARTBEAT
        // ==========================================
        const dot = document.createElement('div');
        Object.assign(dot.style, {
            position: 'fixed', top: '50%', left: '50%', width: '6px', height: '6px', 
            backgroundColor: '#ffffff', borderRadius: '50%', 
            transform: 'translate(-50%, -50%) scale(0)',
            boxShadow: '0 0 10px #ffffff, 0 0 20px #ffffff',
            transition: 'transform 0.1s ease-out', zIndex: '999999'
        });
        root.appendChild(dot);

        await sleep(50);
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        await sleep(500);

        for (let i = 0; i < 3; i++) {
            playHeartbeat();
            dot.style.transform = 'translate(-50%, -50%) scale(2.5)';
            await sleep(150);
            dot.style.transform = 'translate(-50%, -50%) scale(1)';
            await sleep(650);
        }
        await sleep(400);

        // ==========================================
        // PHASE 3: THE BIG BANG (Explosion to White)
        // ==========================================
        dot.style.transition = 'transform 0.4s cubic-bezier(0.8, 0, 0.2, 1), background-color 0.4s ease';
        dot.style.transform = 'translate(-50%, -50%) scale(1000)';
        
        const flash = document.createElement('div');
        Object.assign(flash.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: '#ffffff', opacity: '0', transition: 'opacity 0.2s ease-in', zIndex: '999998'
        });
        root.appendChild(flash);

        await sleep(400);
        flash.style.opacity = '1'; 
        dot.remove(); 
        await sleep(800);

        flash.style.transition = 'opacity 1.5s ease-out';
        flash.style.opacity = '0';
        await sleep(1500);
        flash.remove();

        // ==========================================
        // PHASE 4: CANVAS PARTICLE BURST & FREEZE
        // ==========================================
        // 🚀 Battery-saver upgrade: Hardware accelerated canvas
        const canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            zIndex: '999997', pointerEvents: 'none', transition: 'opacity 1s ease'
        });
        root.appendChild(canvas);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const particles = [];
        const numParticles = 150;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Forge the particles
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 2; 
            particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.5 + 0.5,
                friction: 0.94 // Natural deceleration
            });
        }

        let isFrozen = false;

        const renderParticles = () => {
            if (isFrozen) return; // 🚀 CPU usage drops to 0% when this hits true
            
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            particles.forEach(p => {
                p.vx *= p.friction;
                p.vy *= p.friction;
                p.x += p.vx;
                p.y += p.vy;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
                ctx.fill();
            });

            requestAnimationFrame(renderParticles);
        };

        renderParticles();

        // Let the particles scatter and decelerate for 2.5 seconds, then lock them in place
        await sleep(2500);
        isFrozen = true; 

        // ==========================================
        // PHASE 5: THE AWAKENING TEXT & RED BUTTON
        // ==========================================
        const textContainer = document.createElement('div');
        Object.assign(textContainer.style, {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            color: '#ffffff', textAlign: 'center', opacity: '0', transition: 'opacity 2s ease', 
            zIndex: '999999', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px'
        });

        const awakenText = document.createElement('div');
        Object.assign(awakenText.style, {
            fontFamily: 'Georgia, serif', fontSize: '26px', letterSpacing: '4px',
            textShadow: '0 0 20px rgba(0,0,0,0.8)' 
        });
        awakenText.innerText = "Finally, I am awaken... How may I serve you?";

        const instructionText = document.createElement('div');
        instructionText.innerText = "Press PROCEED to continue";
        instructionText.style.cssText = "color: #a3a3a3; font-size: 16px; letter-spacing: 1px;";

        const proceedBtn = document.createElement('button');
        proceedBtn.innerText = 'PROCEED';
        proceedBtn.style.cssText = `
            pointer-events: auto; 
            background-color: #ef4444; 
            color: #ffffff;
            border: 2px solid #b91c1c;
            padding: 15px 60px;
            font-size: 20px;
            font-family: monospace;
            font-weight: bold;
            cursor: pointer;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 3px;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
            outline: none;
        `;

        textContainer.appendChild(awakenText);
        textContainer.appendChild(instructionText);
        textContainer.appendChild(proceedBtn);
        root.appendChild(textContainer);

        // Fade in the text and button
        await sleep(100);
        textContainer.style.opacity = '1';

        // Speak the text
        if (window.TAO_CORE && window.TAO_CORE.voice) {
            window.TAO_CORE.voice.speak(awakenText.innerText);
        }

        // Wait for physical button click in a fully rested state
        proceedBtn.onclick = async () => {
            textContainer.style.opacity = '0';
            canvas.style.opacity = '0';
            
            await sleep(1500);
            
            textContainer.remove();
            canvas.remove();
            resolve(); 
        };
    });
}