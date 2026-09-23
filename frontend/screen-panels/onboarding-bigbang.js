import { speak } from '../components/voiceManager.js';

export async function runBigBang(targetElement, onComplete) {
    targetElement.innerHTML = '';
    targetElement.style.backgroundColor = '#000000';
    targetElement.style.margin = '0';
    targetElement.style.overflow = 'hidden';
    targetElement.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
    targetElement.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    const textOverlay = document.createElement('div');
    textOverlay.style.position = 'absolute';
    textOverlay.style.top = '50%';
    textOverlay.style.left = '50%';
    textOverlay.style.transform = 'translate(-50%, -50%)';
    textOverlay.style.color = '#e2e8f0';
    textOverlay.style.fontFamily = 'monospace';
    textOverlay.style.fontSize = '18px';
    textOverlay.style.textAlign = 'center';
    textOverlay.style.maxWidth = '600px';
    textOverlay.style.lineHeight = '1.8';
    textOverlay.style.zIndex = '10';
    textOverlay.style.opacity = '0';
    textOverlay.style.transition = 'opacity 2s ease-in-out';
    targetElement.appendChild(textOverlay);

    const promptOverlay = document.createElement('div');
    promptOverlay.style.position = 'absolute';
    promptOverlay.style.bottom = '10%';
    promptOverlay.style.left = '50%';
    promptOverlay.style.transform = 'translateX(-50%)';
    promptOverlay.style.color = '#10b981';
    promptOverlay.style.fontFamily = 'monospace';
    promptOverlay.style.fontSize = '14px';
    promptOverlay.style.zIndex = '10';
    promptOverlay.style.opacity = '0';
    promptOverlay.style.transition = 'opacity 1s ease-in-out';
    promptOverlay.innerText = '[ Press ENTER to Awaken ]';
    targetElement.appendChild(promptOverlay);

    let taoText = "Out of the absolute void, a new universe is born. Its true name is unknown. I am simply known as... TAO.";
    try {
        const response = await fetch('/api/onboarding/text/primordial_awakening');
        const data = await response.json();
        if (data.text) taoText = data.text;
    } catch (err) {
        console.error("Failed to fetch primordial text.");
    }

    let particles = [];
    let phase = 'singularity'; 
    let singularitySize = 2.5;
    let pulseAngle = 0;

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 18 + 2; 
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = Math.random() * 1.5 + 0.5;
            this.color = `rgba(255, 255, 255, ${Math.random()})`;
            this.friction = 0.94; 
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= this.friction;
            this.vy *= this.friction;
        }
        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        if (phase === 'singularity') {
            pulseAngle += 0.04;
            const currentSize = singularitySize + Math.sin(pulseAngle) * 0.8;
            
            ctx.beginPath();
            ctx.arc(cx, cy, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (phase === 'bang' || phase === 'universe') {
            particles.forEach(p => {
                p.update();
                p.draw(ctx);
            });
        }

        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    function finishOnboarding(e) {
        if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
            window.removeEventListener('keydown', finishOnboarding);
            targetElement.removeEventListener('click', finishOnboarding);
            
            targetElement.style.transition = 'opacity 1.5s ease';
            targetElement.style.opacity = '0';
            
            setTimeout(() => {
                targetElement.style.opacity = '1'; 
                onComplete(); 
            }, 1500);
        }
    }

    setTimeout(() => {
        phase = 'bang';
        for (let i = 0; i < 500; i++) {
            particles.push(new Particle(canvas.width / 2, canvas.height / 2));
        }
        
        setTimeout(() => {
            phase = 'universe';
            textOverlay.innerText = taoText;
            textOverlay.style.opacity = '1';
            
            speak(taoText);

            setTimeout(() => {
                promptOverlay.style.opacity = '1';
                window.addEventListener('keydown', finishOnboarding);
                targetElement.addEventListener('click', finishOnboarding);
            }, 4500); 
        }, 1500);

    }, 3500); 
}
