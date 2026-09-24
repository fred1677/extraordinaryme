// File: /backend/server.js

/**
 * ============================================================================
 * MASTER API SWITCHBOARD & SERVER ARCHITECTURE (TAO OS)
 * ============================================================================
 * Welcome to the "Brain" of TAO OS. This file is the central switchboard that 
 * connects the frontend visual desktop to the backend database and AI engines.
 * 
 * DIRECTORY:
 * SECTION 1: SETTINGS & MIDDLEWARE (The basic rules for connecting)
 * SECTION 2: IDENTITY & SECURITY (Gate 1 Login, Gate 2 Backend Vault, Live Checks & Audit Logs)
 * SECTION 3: SYSTEM LOGS (The internal diary of everything that happens)
 * SECTION 4: THE FORGE (Where desktop icons and apps are saved and loaded)
 * SECTION 5: AI ENGINES (The Local AI brain and the Cloud AI fallback)
 * SECTION 6: ADVERTISING (The billboard system for free-tier users)
 * SECTION 7: FALLBACK ROUTING (Keeping users inside the OS interface)
 * SECTION 8: SERVER IGNITION (Starting the engine)
 * ============================================================================
 */

const path = require('path');

// 1. Load Secret Variables: This pulls in hidden passwords (like your database 
// connection string) from your .env files so they aren't exposed in the code.
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') }); 

const express = require('express');
const cors = require('cors'); 
const db = require('./db/db.js'); 
const bootstrapDatabase = require('./db/bootstrap.js'); 

// The Cloud AI Engine (Connects to Groq/External LLMs when local AI gets confused)
const taoEngine = require('./engine/taoengine');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECTION 1: SETTINGS & MIDDLEWARE (The Basic Rules)
// ============================================================================

// CORS (Cross-Origin Resource Sharing): This acts like an open-door policy, 
// allowing mobile apps or external websites to talk to this server.
app.use(cors()); 

// JSON Parser: Translates incoming data from the frontend into readable JavaScript objects.
app.use(express.json());

// Public Folder: Tells the server to serve the visual desktop files (HTML/CSS) to anyone who visits the website URL.
app.use(express.static(path.join(__dirname, '../frontend')));


// ============================================================================
// SECTION 2: IDENTITY & SECURITY (The Two-Vault System)
// ============================================================================

/**
 * Endpoint: POST /api/auth/register
 * Purpose: Creates a brand new user account.
 * Layperson Explanation: When a new user signs up, this checks if they are the 
 * very first 'Tao' founder. If yes, it grants ultimate 'Godmode' power. If not, 
 * they become a standard 'Explorer' locked to the public frontend.
 */
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const godmodeCheck = await db.pool.query(`SELECT id FROM users WHERE designation = 'Godmode'`);
        const isTao = username === 'Tao';
        const assignedDesignation = (isTao && godmodeCheck.rows.length === 0) ? 'Godmode' : 'Explorer';

        const query = `
            INSERT INTO users (username, email, password_hash, designation)
            VALUES ($1, $2, $3, $4)
            RETURNING id, designation, is_taouser, tao_roles, requires_password_change;
        `;
        const result = await db.pool.query(query, [username, email, password, assignedDesignation]);
        
        res.status(201).json({ 
            success: true, 
            user_id: result.rows[0].id,
            payload: { 
                clearance: result.rows[0].designation,
                is_taouser: result.rows[0].is_taouser,
                tao_roles: result.rows[0].tao_roles,
                requires_password_change: result.rows[0].requires_password_change
            } 
        });
    } catch (err) {
        console.error('[Auth Register Error]:', err.message);
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * Endpoint: POST /api/auth/login
 * Purpose: GATE 1 (The Public Front Door).
 * Layperson Explanation: Checks the username and password to let the user into 
 * the standard desktop. It also securely passes their hidden "Taouser" status 
 * back to the frontend to prepare the trapdoor, without showing it to the user.
 */
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = `SELECT id, password_hash, designation, is_taouser, tao_roles, requires_password_change FROM users WHERE username = $1`;
        const result = await db.pool.query(query, [username]);

        if (result.rows.length === 0 || result.rows[0].password_hash !== password) {
            return res.status(401).json({ success: false, error: "Invalid credentials." });
        }

        res.status(200).json({ 
            success: true, 
            user_id: result.rows[0].id,
            payload: { 
                clearance: result.rows[0].designation,
                is_taouser: result.rows[0].is_taouser,
                tao_roles: result.rows[0].tao_roles,
                requires_password_change: result.rows[0].requires_password_change
            }
        });
    } catch (err) {
        console.error('[Auth Login Error]:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Endpoint: POST /api/auth/check-clearance
 * Purpose: LIVE ZERO-TRUST VERIFICATION & SECURITY AUDIT TRAIL.
 * Layperson Explanation: When someone types "enter backend" into the chatbox, 
 * we never trust the browser's memory because a user could modify it in DevTools. 
 * Instead, this endpoint reaches straight into the live AWS PostgreSQL database 
 * to fetch that user's actual clearance.
 * 
 * In addition, it acts as a digital security guard: it immediately logs every single 
 * backend entry attempt into the system diary (system_logs table), noting who 
 * knocked on the door, what their database record returned, and whether access was 
 * GRANTED or DENIED.
 */
app.post('/api/auth/check-clearance', async (req, res) => {
    const { userId } = req.body;
    try {
        if (!userId) {
            console.warn('[Security Gateway] Clearance check rejected: No session ID provided.');
            return res.status(401).json({ is_taouser: false });
        }

        // 1. Query the live AWS PostgreSQL database directly
        const query = `SELECT id, username, designation, is_taouser, tao_roles FROM users WHERE id = $1`;
        const result = await db.pool.query(query, [userId]);

        // If no user matches this ID in the database
        if (result.rows.length === 0) {
            console.warn(`[Security Gateway] Clearance check failed: User ID [${userId}] not found in AWS DB.`);
            
            // Record unknown access attempt in system logs
            db.createSystemLog({ 
                userId: userId, 
                moduleName: 'SecurityGateway', 
                message: `Backend entry denied: Unknown or deleted user ID [${userId}].`, 
                type: 'WARNING' 
            }).catch(logErr => console.error('[Logger] Failed to write security log:', logErr.message));

            return res.status(401).json({ is_taouser: false });
        }

        const user = result.rows[0];
        const statusVerdict = user.is_taouser ? 'GRANTED' : 'DENIED';

        // 2. Output to the server terminal so administrators see it live
        console.log(`[Security Gateway] Backend entry check for [${user.username}]: AWS DB is_taouser=${user.is_taouser} -> Access ${statusVerdict}`);

        // 3. Write permanent audit log entry into the database system diary
        db.createSystemLog({ 
            userId: user.id, 
            moduleName: 'SecurityGateway', 
            message: `User [${user.username}] (Designation: ${user.designation}) requested backend entry. AWS DB Result: is_taouser=${user.is_taouser}. Verdict: ${statusVerdict}.`, 
            type: user.is_taouser ? 'INFO' : 'WARNING' 
        }).catch(logErr => console.error('[Logger] Failed to write security log:', logErr.message));

        // 4. Return the live AWS verification flag to the chatbox
        res.status(200).json({ 
            is_taouser: user.is_taouser,
            username: user.username 
        });

    } catch (err) {
        console.error('[Live Clearance Check Error]:', err.message);
        res.status(500).json({ is_taouser: false });
    }
});

/**
 * Endpoint: POST /api/auth/verify-taouser
 * Purpose: GATE 2 (The Classified Backend Trapdoor).
 * Layperson Explanation: This is the ultra-secure lock for the Chatbox command 
 * "enter backend". It uses advanced math (bcrypt via PostgreSQL pgcrypto) to 
 * completely scramble the Level-2 password. Even if a hacker steals the database, 
 * they cannot read these passwords. 
 */
app.post('/api/auth/verify-taouser', async (req, res) => {
    const { userId, password } = req.body;
    try {
        // Ensure the Level-2 Password Vault exists in the database
        await db.pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS tao_password_hash VARCHAR(255)`);
        
        const userCheck = await db.pool.query(`SELECT is_taouser, requires_password_change, tao_password_hash FROM users WHERE id = $1`, [userId]);
        
        if (userCheck.rows.length === 0 || !userCheck.rows[0].is_taouser) {
            return res.status(403).json({ success: false, error: 'Unauthorized.' });
        }

        const user = userCheck.rows[0];

        if (user.requires_password_change) {
            // First time setup: Encrypt the new password with Blowfish (bcrypt) and save it forever.
            await db.pool.query(`
                UPDATE users 
                SET tao_password_hash = crypt($1, gen_salt('bf')), 
                    requires_password_change = false 
                WHERE id = $2
            `, [password, userId]);
            
            return res.status(200).json({ success: true, message: 'Level-2 Vault secured.' });
        } else {
            // Future logins: Compare what they typed against the scrambled hash in the database.
            const verify = await db.pool.query(`
                SELECT id FROM users 
                WHERE id = $1 AND tao_password_hash = crypt($2, tao_password_hash)
            `, [userId, password]);

            if (verify.rows.length === 0) {
                return res.status(401).json({ success: false, error: 'Invalid Level-2 Credentials.' });
            }

            return res.status(200).json({ success: true, message: 'Access Granted.' });
        }
    } catch (err) {
        console.error('[Taouser Verify Error]:', err.message);
        res.status(500).json({ success: false, error: 'Internal server error.' });
    }
});


// ============================================================================
// SECTION 3: SYSTEM LOGS (The Internal Diary)
// ============================================================================

/**
 * Endpoint: POST /api/system/log
 * Layperson Explanation: Silently writes down system errors or important user 
 * actions into a database diary without freezing or interrupting the user's screen.
 */
app.post('/api/system/log', async (req, res) => {
    try {
        const { userId, module, message, type } = req.body;
        await db.createSystemLog({ userId, moduleName: module, message, type });
        res.status(200).json({ status: 'Log recorded' });
    } catch (error) {
        console.error('[Express Logger Error]:', error.message);
        res.status(200).json({ status: 'Log failed silently' });
    }
});

/**
 * Endpoint: GET /api/system/log
 * Layperson Explanation: Allows Admin tools to read the diary and filter it by 
 * specific users or errors to see what went wrong in the past.
 */
app.get('/api/system/log', async (req, res) => {
    try {
        const filters = { userId: req.query.userId, module: req.query.module, type: req.query.type };
        const logs = await db.getHistoricalLogs(filters);
        res.status(200).json(logs);
    } catch (error) {
        console.error('[Express Logger Error]:', error.message);
        res.status(500).json({ error: 'Failed to retrieve historical logs' });
    }
});


// ============================================================================
// SECTION 4: THE FORGE (Desktop Icons and Apps)
// ============================================================================

/**
 * Endpoint: GET /api/objects
 * Layperson Explanation: When a user logs in, this asks the database: "What 
 * icons, folders, and apps is this specific user allowed to see on their desktop?"
 */
app.get('/api/objects', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || req.query.userId || 'unknown';
        const objects = await db.getVisibleObjects(userId);
        res.status(200).json(objects);
    } catch (err) {
        console.error(`[Express] Object Read Error:`, err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});

/**
 * Endpoint: POST /api/objects
 * Layperson Explanation: Creates a brand new icon or application setting and 
 * saves it permanently to the database so it stays there after they log out.
 */
app.post('/api/objects', async (req, res) => {
    try {
        const blueprint = req.body;
        console.log(`[Express] Forging new TAO object: ${blueprint.name}`);
        const newObject = await db.createTaoObject(blueprint);
        res.status(201).json(newObject);
    } catch (err) {
        console.error(`[Express] Forge Error:`, err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});

/**
 * Endpoint: DELETE /api/objects/:id
 * Layperson Explanation: When a user drags an app to the trash, this permanently 
 * deletes it from the database forever.
 */
app.delete('/api/objects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.pool.query('DELETE FROM user_modules WHERE id = $1', [id]);
        console.log(`[Backend] Permanently deleted object ID: ${id}`);
        res.status(200).json({ status: "success", message: "Object annihilated." });
    } catch (err) {
        console.error(`[Express] Delete Error:`, err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});


// ============================================================================
// SECTION 5: AI ENGINES (The Chatbox Brain)
// ============================================================================

/**
 * LOCAL AI BRAIN (Node-NLP)
 * Layperson Explanation: A tiny, super-fast artificial intelligence built directly 
 * into this server. It handles simple commands (like "open health app") instantly, 
 * without needing to talk to the internet.
 */
const { NlpManager } = require('node-nlp');
const nlp = new NlpManager({ languages: ['en'], forceNER: true });

// Train the local AI on basic OS commands
nlp.addDocument('en', 'open health', 'os.open.health');
nlp.addDocument('en', 'log blood pressure', 'health.log.bp');
(async () => {
    await nlp.train();
    console.log('[AWS AI] Local Node-NLP Manager trained and online.');
})();

let transformerPipeline;
(async () => {
    const { pipeline } = await import('@xenova/transformers');
    transformerPipeline = pipeline;
    console.log('[AWS AI] Transformers.js local pipeline ready.');
})();

/**
 * Endpoint: POST /api/chat (The Interceptor)
 * Layperson Explanation: When a user types a message in the Chatbox, it comes 
 * here first. The Local AI tries to answer it instantly. If the Local AI gets 
 * confused, it passes the question forward to the smarter Cloud AI.
 */
app.post('/api/chat', async (req, res, next) => {
    try {
        const { message } = req.body;
        if (!message) return next();

        const nlpResult = await nlp.process('en', message);
        
        // If the Local AI is at least 70% sure it knows the answer, reply immediately.
        if (nlpResult.intent !== 'None' && nlpResult.score > 0.7) {
            return res.status(200).json({
                response: `[Local AWS AI] Intent Recognized: ${nlpResult.intent}`
            });
        }
        
        // Otherwise, move to the next step (Cloud AI).
        next();
    } catch (e) {
        console.error('[Local AI Error]:', e);
        next(); // Move to next step if local AI crashes
    }
});

/**
 * Endpoint: ALL /api/chat (The Cloud Fallback)
 * Layperson Explanation: This connects to powerful external AI models (like Gemini 
 * or Groq) to handle complex conversations that the Local AI couldn't understand.
 */
app.use('/api/chat', taoEngine);

/**
 * Endpoint: ALL /api/apps (Hardware Scanner)
 * Layperson Explanation: Checks if the server is running on an Apple Mac computer 
 * or on a remote cloud server. If it's a Mac, it turns on a special scanner.
 */
if (process.platform === 'darwin') {
    const appScanner = require('./app-scanner');
    app.use('/api/apps', appScanner);
    console.log(`[System] macOS detected. Hardware scanner enabled.`);
} else {
    app.use('/api/apps', (req, res) => {
        res.status(501).json({ success: false, error: 'Hardware commands are disabled on cloud hosting.' });
    });
    console.log(`[System] Cloud environment detected. Hardware scanner disabled.`);
}


// ============================================================================
// SECTION 6: ADVERTISING (The Billboard)
// ============================================================================

/**
 * Endpoint: ALL /api/ads
 * Layperson Explanation: Feeds sponsored advertisements and "Upgrade to Pro" 
 * messages to the top and bottom bars for users who haven't paid for a subscription.
 */
const adsRouter = require('./utils/ads.js');
app.use('/api/ads', adsRouter);


// ============================================================================
// SECTION 7: FALLBACK ROUTING (Keeping Users in the Matrix)
// ============================================================================

/**
 * Route: GET *
 * Layperson Explanation: If a user tries to refresh the page or type a weird URL 
 * in their browser, this catches them and smoothly drops them back onto the TAO 
 * OS desktop screen instead of showing an ugly "404 Page Not Found" error.
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


// ============================================================================
// SECTION 8: SERVER IGNITION (Starting the Engine)
// ============================================================================

/**
 * Pre-Flight Sequence
 * Layperson Explanation: Before letting anyone log in, the server knocks on the 
 * door of the database to make sure it is awake. If the database answers, it 
 * opens Port 3000 to the world and says "Online & Listening." If the database 
 * doesn't answer, it triggers a CRITICAL FAILURE and safely turns the server off.
 */
bootstrapDatabase()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n=============================================`);
            console.log(`🚀 [TAO OS BACKEND] Online & Listening on Port ${PORT}`);
            console.log(`📡 Network Mode: Open (Ready for Mobile/Desktop testing)`);
            console.log(`🧠 AI Subsystem: AWS Local NLP + Cloud Fallback mounted`);
            console.log(`=============================================`);
        });
    })
    .catch((err) => {
        console.error('\n[System] CRITICAL FAILURE: Could not verify database connection.');
        console.error('[System] Error Details:', err.message);
        console.error('[System] Aborting server boot sequence.\n');
        process.exit(1);
    });