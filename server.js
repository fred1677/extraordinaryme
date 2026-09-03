// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, initDB } = require('./db');
const { validateCredentialsWithRules } = require('./src/utils/validators');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'extraordinary_me_jwt_secret_key_2026';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'src')));

// Auth Verification Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required.' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = decoded;
        next();
    });
}

// Strict Admin Gatekeeper
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
    }
    next();
}

// Helper: Fetch currently active auth policy
async function getActiveAuthRules() {
    const res = await pool.query('SELECT * FROM auth_settings WHERE id = 1 LIMIT 1');
    return res.rows[0];
}

// ---------------- LEGAL AGREEMENT ROUTES ----------------

app.get('/api/agreements/active', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, type, version, title, content FROM legal_agreements WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1`
        );
        res.json({ agreement: result.rows[0] });
    } catch (err) {
        console.error('Fetch agreement error:', err);
        res.status(500).json({ error: 'Failed to fetch active agreement.' });
    }
});

app.get('/api/agreements/status', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.type, a.version, a.title, a.content,
                   CASE WHEN uaa.id IS NOT NULL THEN TRUE ELSE FALSE END AS has_accepted
            FROM legal_agreements a
            LEFT JOIN user_agreement_acceptances uaa ON a.id = uaa.agreement_id AND uaa.user_id = $1
            WHERE a.is_active = TRUE
            ORDER BY a.created_at DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [req.user.id]);
        res.json({ agreementStatus: result.rows[0] });
    } catch (err) {
        console.error('Check agreement status error:', err);
        res.status(500).json({ error: 'Failed to check agreement status.' });
    }
});

app.post('/api/agreements/accept', authenticateToken, async (req, res) => {
    const { agreement_id } = req.body;
    if (!agreement_id) return res.status(400).json({ error: 'Agreement ID is required.' });

    try {
        await pool.query(
            `INSERT INTO user_agreement_acceptances (user_id, agreement_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, agreement_id) DO NOTHING`,
            [req.user.id, agreement_id]
        );
        res.json({ success: true, message: 'Agreement recorded.' });
    } catch (err) {
        console.error('Accept agreement error:', err);
        res.status(500).json({ error: 'Failed to record agreement.' });
    }
});

// ---------------- AUTH RULES ENDPOINTS ----------------

app.get('/api/auth/rules', async (req, res) => {
    try {
        const rules = await getActiveAuthRules();
        res.json({ rules });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch auth rules.' });
    }
});

// ---------------- AUTHENTICATION ROUTES ----------------

app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password, agreement_id } = req.body;

    const currentRules = await getActiveAuthRules();
    const validationResult = validateCredentialsWithRules({ username, email, password }, currentRules);
    if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.error });
    }
    if (!agreement_id) return res.status(400).json({ error: 'You must accept the legal agreement.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email.toLowerCase().trim(), username.trim()]
        );
        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Username or email already exists.' });
        }

        // All public signups are standard users (no auto-admin elevation)
        const assignedRole = 'user';

        const passwordHash = await bcrypt.hash(password, 12);

        const userResult = await client.query(
            `INSERT INTO users (
                username, email, password_hash, role, password_policy_revision
            )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, role, created_at`,
            [username.trim(), email.toLowerCase().trim(), passwordHash, assignedRole, currentRules.policy_revision]
        );
        const newUser = userResult.rows[0];

        await client.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [newUser.id]);
        await client.query(`INSERT INTO user_agreement_acceptances (user_id, agreement_id) VALUES ($1, $2)`, [newUser.id, agreement_id]);

        await client.query('COMMIT');

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({ token, user: newUser, is_new_user: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account.' });
    } finally {
        client.release();
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Credentials required.' });

    try {
        const query = 'SELECT * FROM users WHERE username = $1 OR email = $1 LIMIT 1';
        const result = await pool.query(query, [username.toLowerCase().trim()]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
        if (user.is_active === false) return res.status(403).json({ error: 'This account has been deactivated.' });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });

        // 30-day compliance evaluation
        if (user.requires_compliance_update && user.compliance_deadline) {
            const now = new Date();
            const deadline = new Date(user.compliance_deadline);
            if (now > deadline) {
                return res.status(403).json({
                    error: 'Account flagged for deletion: 30-day credential update grace period has expired.',
                    compliance_expired: true
                });
            }
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                requires_compliance_update: user.requires_compliance_update,
                compliance_deadline: user.compliance_deadline,
                compliance_flag_reason: user.compliance_flag_reason
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed.' });
    }
});

// ---------------- PROFILE ROUTES ----------------

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.companion_name, p.awakening_announcement, p.awakened_prompt, 
                    p.origin_story, p.origin_media, p.updated_at,
                    u.id, u.username, u.email, u.role, u.requires_compliance_update, u.compliance_deadline, u.compliance_flag_reason
             FROM users u
             LEFT JOIN user_profiles p ON u.id = p.user_id
             WHERE u.id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Profile not found.' });
        res.json({ profile: result.rows[0] });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Failed to retrieve profile.' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const { companion_name, awakening_announcement, awakened_prompt, origin_story, origin_media } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO user_profiles (
                user_id, companion_name, awakening_announcement, 
                awakened_prompt, origin_story, origin_media, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                companion_name = COALESCE($2, user_profiles.companion_name),
                awakening_announcement = COALESCE($3, user_profiles.awakening_announcement),
                awakened_prompt = COALESCE($4, user_profiles.awakened_prompt),
                origin_story = COALESCE($5, user_profiles.origin_story),
                origin_media = COALESCE($6, user_profiles.origin_media),
                updated_at = NOW()
            RETURNING *`,
            [req.user.id, companion_name, awakening_announcement, awakened_prompt, origin_story, origin_media ? JSON.stringify(origin_media) : null]
        );
        res.json({ profile: result.rows[0], message: 'Profile saved.' });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
});

// ---------------- ADMIN MODULE ----------------

// Get all users with status & compliance flags
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.username, u.email, u.role, u.is_active, u.created_at,
                   u.requires_compliance_update, u.compliance_flag_reason, u.compliance_deadline,
                   p.companion_name
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            ORDER BY u.created_at DESC
        `);
        res.json({ users: result.rows });
    } catch (err) {
        console.error('Admin user list error:', err);
        res.status(500).json({ error: 'Failed to retrieve user directory.' });
    }
});

// Admin update runtime auth rules & optionally trigger 30-day migration flagging
app.put('/api/admin/auth/rules', authenticateToken, requireAdmin, async (req, res) => {
    const {
        min_username_length,
        max_username_length,
        min_password_length,
        require_uppercase,
        require_number,
        require_special_char,
        flag_legacy_users
    } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const updateRulesQuery = `
            UPDATE auth_settings 
            SET min_username_length = COALESCE($1, min_username_length),
                max_username_length = COALESCE($2, max_username_length),
                min_password_length = COALESCE($3, min_password_length),
                require_uppercase = COALESCE($4, require_uppercase),
                require_number = COALESCE($5, require_number),
                require_special_char = COALESCE($6, require_special_char),
                policy_revision = policy_revision + 1,
                updated_at = NOW()
            WHERE id = 1
            RETURNING *
        `;
        const ruleRes = await client.query(updateRulesQuery, [
            min_username_length,
            max_username_length,
            min_password_length,
            require_uppercase,
            require_number,
            require_special_char
        ]);
        const newPolicy = ruleRes.rows[0];

        let flaggedCount = 0;
        if (flag_legacy_users) {
            const flagQuery = `
                UPDATE users
                SET requires_compliance_update = TRUE,
                    compliance_flag_reason = CASE 
                        WHEN LENGTH(username) < $1 THEN 'Username too short'
                        WHEN LENGTH(username) > $2 THEN 'Username too long'
                        ELSE 'Credential upgrade required for production'
                    END,
                    compliance_deadline = NOW() + INTERVAL '30 days'
                WHERE role != 'admin' 
                  AND (
                      LENGTH(username) < $1 
                      OR LENGTH(username) > $2 
                      OR password_policy_revision < $3
                  )
                RETURNING id
            `;
            const flagRes = await client.query(flagQuery, [
                newPolicy.min_username_length,
                newPolicy.max_username_length,
                newPolicy.policy_revision
            ]);
            flaggedCount = flagRes.rowCount;
        }

        await client.query('COMMIT');
        res.json({
            rules: newPolicy,
            message: `Auth policy updated.${flag_legacy_users ? ` Flagged ${flaggedCount} legacy account(s) for update within 30 days.` : ''}`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update auth rules error:', err);
        res.status(500).json({ error: 'Failed to update auth policy.' });
    } finally {
        client.release();
    }
});

// Admin create user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    const { username, email, password, role } = req.body;
    const currentRules = await getActiveAuthRules();
    const validationResult = validateCredentialsWithRules({ username, email, password }, currentRules);
    if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.error });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const passwordHash = await bcrypt.hash(password, 12);
        const result = await client.query(
            `INSERT INTO users (username, email, password_hash, role, password_policy_revision)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, email, role, is_active, created_at`,
            [username.trim(), email.toLowerCase().trim(), passwordHash, role === 'admin' ? 'admin' : 'user', currentRules.policy_revision]
        );
        const newUser = result.rows[0];
        await client.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [newUser.id]);
        await client.query('COMMIT');
        res.status(201).json({ user: newUser });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Admin create user error:', err);
        res.status(500).json({ error: 'Failed to create user.' });
    } finally {
        client.release();
    }
});

// Admin update user (status, email, role, password, or reset compliance flag)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { email, role, is_active, password, clear_compliance } = req.body;

    try {
        let query = `
            UPDATE users 
            SET email = COALESCE($1, email),
                role = COALESCE($2, role),
                is_active = COALESCE($3, is_active),
                updated_at = NOW()
        `;
        let values = [email ? email.toLowerCase().trim() : null, role, is_active];

        if (clear_compliance) {
            query += `, requires_compliance_update = FALSE, compliance_deadline = NULL, compliance_flag_reason = NULL`;
        }

        if (password) {
            const passwordHash = await bcrypt.hash(password, 12);
            query += `, password_hash = $4 WHERE id = $5 RETURNING id, username, email, role, is_active, updated_at`;
            values.push(passwordHash, id);
        } else {
            query += ` WHERE id = $4 RETURNING id, username, email, role, is_active, updated_at`;
            values.push(id);
        }

        const result = await pool.query(query, values);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

        res.json({ user: result.rows[0], message: 'User updated successfully.' });
    } catch (err) {
        console.error('Admin update user error:', err);
        res.status(500).json({ error: 'Failed to update user.' });
    }
});

// Admin delete user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
        return res.status(400).json({ error: 'Self-deletion is prohibited.' });
    }

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json({ message: `User ${result.rows[0].username} deleted successfully.` });
    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user.' });
    }
});

// ---------------- SPA FALLBACK & BOOTSTRAP ----------------

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

async function startServer() {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`🚀 ExtraordinaryMe server running at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('DB init failed:', err);
        process.exit(1);
    }
}

startServer();