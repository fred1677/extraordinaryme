// src/app.js
import { initRouter } from './router.js';

async function bootstrap() {
    const token = localStorage.getItem('auth_token');
    
    // Redirect unauthenticated visitors straight to login
    if (!token && window.location.hash !== '#login') {
        window.location.hash = '#login';
    }

    initRouter();
}

bootstrap();