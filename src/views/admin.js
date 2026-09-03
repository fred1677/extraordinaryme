// src/views/admin.js
import { openHelpModal } from '../utils/helpContent.js';

export function render() {
    return `
        <div style="min-height: 100vh; background: #0b0f19; color: #f3f4f6; padding: 2rem; font-family: system-ui, -apple-system, sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto;">
                
                <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #1f2937; padding-bottom: 1.25rem;">
                    <div>
                        <h1 style="font-size: 1.85rem; font-weight: 800; margin: 0; color: #818cf8;">Admin Console</h1>
                        <p style="color: #9ca3af; margin: 0.35rem 0 0; font-size: 0.95rem;">Configure platform credential rules and manage user compliance.</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <button id="open-create-modal" style="padding: 0.55rem 1.1rem; background: #4f46e5; color: #ffffff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            + Create User
                        </button>
                        
                        <!-- Global Help Link -->
                        <a href="#help" id="nav-admin-help-link" style="padding: 0.55rem 0.9rem; background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">
                            ❓ Help
                        </a>

                        <a href="#home" style="padding: 0.55rem 1.1rem; background: #1f2937; color: #e5e7eb; border-radius: 8px; text-decoration: none; font-weight: 600;">
                            ← Back to App
                        </a>
                    </div>
                </header>

                <div id="admin-message" style="display: none; padding: 0.85rem 1.2rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.95rem;"></div>

                <!-- Live Rule Configuration Card -->
                <section style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: #f9fafb;">Runtime Authentication Rules</h2>
                            <button class="section-help-btn" data-topic="admin_auth_rules" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #818cf8; padding: 0.2rem;" title="Rule Guidance">
                                ℹ️
                            </button>
                        </div>
                        <span id="policy-revision-badge" style="background: #3730a3; color: #c7d2fe; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700;">Revision 1</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 0.85rem; margin: -0.5rem 0 1rem 0;">Adjust standards for development or enforce stringent rules for production rollout.</p>

                    <form id="rules-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; align-items: end;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #9ca3af; margin-bottom: 0.35rem;">Min Username Length</label>
                            <input type="number" id="rule-min-user" min="1" max="20" style="width: 100%; padding: 0.55rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #9ca3af; margin-bottom: 0.35rem;">Max Username Length</label>
                            <input type="number" id="rule-max-user" min="10" max="60" style="width: 100%; padding: 0.55rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; color: #9ca3af; margin-bottom: 0.35rem;">Min Password Length</label>
                            <input type="number" id="rule-min-pass" min="4" max="32" style="width: 100%; padding: 0.55rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.4rem; justify-content: center;">
                            <label style="font-size: 0.8rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                                <input type="checkbox" id="rule-require-upper"> Require Uppercase (A-Z)
                            </label>
                            <label style="font-size: 0.8rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                                <input type="checkbox" id="rule-require-num"> Require Number (0-9)
                            </label>
                            <label style="font-size: 0.8rem; color: #cbd5e1; display: flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                                <input type="checkbox" id="rule-require-spec"> Require Special Char (!@#$)
                            </label>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <button type="submit" style="padding: 0.65rem 1rem; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Save Live Rules</button>
                            <button type="button" id="enforce-prod-btn" style="padding: 0.65rem 1rem; background: #b91c1c; color: #fee2e2; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.8rem;">
                                ⚠️ Enforce Strict & Flag 30 Days
                            </button>
                        </div>
                    </form>
                </section>

                <!-- Platform User Directory -->
                <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden;">
                    <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            <h2 style="font-size: 1.15rem; font-weight: 700; margin: 0; color: #f3f4f6;">User Directory</h2>
                            <button class="section-help-btn" data-topic="admin_user_directory" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #818cf8; padding: 0.2rem;" title="Directory Guidance">
                                ℹ️
                            </button>
                        </div>
                        <span id="user-count-badge" style="color: #9ca3af; font-size: 0.85rem;">0 users registered</span>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                            <thead>
                                <tr style="background: #1e293b; color: #94a3b8; border-bottom: 1px solid #334155;">
                                    <th style="padding: 0.85rem 1.25rem;">Username / ID</th>
                                    <th style="padding: 0.85rem 1.25rem;">Email</th>
                                    <th style="padding: 0.85rem 1.25rem;">Role</th>
                                    <th style="padding: 0.85rem 1.25rem;">Account Status</th>
                                    <th style="padding: 0.85rem 1.25rem;">Compliance Status</th>
                                    <th style="padding: 0.85rem 1.25rem; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="user-table-body">
                                <tr>
                                    <td colspan="6" style="padding: 2rem; text-align: center; color: #64748b;">Loading user database...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Create User Modal -->
                <div id="create-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); align-items: center; justify-content: center; z-index: 50; padding: 1rem;">
                    <div style="background: #111827; border: 1px solid #374151; border-radius: 12px; width: 100%; max-width: 460px; padding: 2rem;">
                        <h3 style="margin: 0 0 1.25rem; font-size: 1.25rem;">Create New Platform User</h3>
                        <form id="create-user-form" style="display: flex; flex-direction: column; gap: 1rem;">
                            <div>
                                <label style="display: block; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.25rem;">Username</label>
                                <input type="text" id="new-username" required style="width: 100%; padding: 0.65rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.25rem;">Email</label>
                                <input type="email" id="new-email" required style="width: 100%; padding: 0.65rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.25rem;">Password</label>
                                <input type="password" id="new-password" required style="width: 100%; padding: 0.65rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.85rem; color: #9ca3af; margin-bottom: 0.25rem;">Role</label>
                                <select id="new-role" style="width: 100%; padding: 0.65rem; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #fff; box-sizing: border-box;">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                                <button type="button" id="close-create-modal" style="padding: 0.65rem 1rem; background: #374151; color: #fff; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                                <button type="submit" style="padding: 0.65rem 1.25rem; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Save User</button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    `;
}

export function init() {
    const tableBody = document.getElementById('user-table-body');
    const msgEl = document.getElementById('admin-message');
    const modal = document.getElementById('create-modal');
    if (modal) modal.style.display = 'none';

    function showMessage(text, isError = false) {
        msgEl.innerText = text;
        msgEl.style.display = 'block';
        msgEl.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
        msgEl.style.color = isError ? '#f87171' : '#4ade80';
        msgEl.style.border = `1px solid ${isError ? '#ef4444' : '#22c55e'}`;
        setTimeout(() => { msgEl.style.display = 'none'; }, 4000);
    }

    async function loadRules() {
        try {
            const res = await fetch('/api/auth/rules');
            const data = await res.json();
            if (data.rules) {
                document.getElementById('rule-min-user').value = data.rules.min_username_length;
                document.getElementById('rule-max-user').value = data.rules.max_username_length;
                document.getElementById('rule-min-pass').value = data.rules.min_password_length;
                document.getElementById('rule-require-upper').checked = data.rules.require_uppercase;
                document.getElementById('rule-require-num').checked = data.rules.require_number;
                document.getElementById('rule-require-spec').checked = data.rules.require_special_char;
                document.getElementById('policy-revision-badge').innerText = `Revision ${data.rules.policy_revision}`;
            }
        } catch (err) {
            console.error('Failed to load rules', err);
        }
    }

    async function loadUsers() {
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 403) {
                tableBody.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #f87171;">Forbidden: Admin privileges required.</td></tr>`;
                return;
            }
            const data = await res.json();
            const users = data.users || [];
            document.getElementById('user-count-badge').innerText = `${users.length} user${users.length === 1 ? '' : 's'} registered`;
            renderTable(users);
        } catch (err) {
            showMessage('Failed to load user list.', true);
        }
    }

    function renderTable(users) {
        if (!users.length) {
            tableBody.innerHTML = `<tr><td colspan="6" style="padding: 2rem; text-align: center; color: #64748b;">No users registered yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = users.map(u => {
            let complianceBadge = `<span style="padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; background: #064e3b; color: #6ee7b7;">Compliant</span>`;
            if (u.requires_compliance_update) {
                const daysRemaining = Math.max(0, Math.ceil((new Date(u.compliance_deadline) - new Date()) / (1000 * 60 * 60 * 24)));
                complianceBadge = `
                    <div style="font-size: 0.75rem;">
                        <span style="display: inline-block; padding: 0.2rem 0.55rem; border-radius: 9999px; background: #7f1d1d; color: #fca5a5; font-weight: 700;">
                            Flagged: ${daysRemaining}d left
                        </span>
                        <div style="color: #94a3b8; margin-top: 0.2rem;">${u.compliance_flag_reason || 'Policy update'}</div>
                    </div>
                `;
            }

            return `
                <tr style="border-bottom: 1px solid #1f2937;">
                    <td style="padding: 1rem 1.25rem; font-weight: 600;">${u.username}</td>
                    <td style="padding: 1rem 1.25rem; color: #9ca3af;">${u.email}</td>
                    <td style="padding: 1rem 1.25rem;">
                        <span style="padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; ${u.role === 'admin' ? 'background: #3730a3; color: #a5b4fc;' : 'background: #1f2937; color: #94a3b8;'}">
                            ${u.role}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.25rem;">
                        <span style="padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; ${u.is_active ? 'background: #064e3b; color: #6ee7b7;' : 'background: #7f1d1d; color: #fca5a5;'}">
                            ${u.is_active ? 'Active' : 'Disabled'}
                        </span>
                    </td>
                    <td style="padding: 1rem 1.25rem;">${complianceBadge}</td>
                    <td style="padding: 1rem 1.25rem; text-align: right;">
                        <button class="toggle-status-btn" data-id="${u.id}" data-active="${u.is_active}" style="padding: 0.35rem 0.65rem; background: #374151; color: #e5e7eb; border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer; margin-right: 0.4rem;">
                            ${u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="delete-user-btn" data-id="${u.id}" data-username="${u.username}" style="padding: 0.35rem 0.65rem; background: #7f1d1d; color: #fca5a5; border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Action button bindings
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const newStatus = btn.dataset.active === 'true' ? false : true;
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`/api/admin/users/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ is_active: newStatus })
                });
                if (res.ok) {
                    showMessage('User status updated.');
                    loadUsers();
                } else {
                    const err = await res.json();
                    showMessage(err.error || 'Failed to update user.', true);
                }
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const username = btn.dataset.username;
                if (!confirm(`Are you sure you want to delete "${username}"?`)) return;

                const token = localStorage.getItem('auth_token');
                const res = await fetch(`/api/admin/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    showMessage(`User ${username} deleted.`);
                    loadUsers();
                } else {
                    const err = await res.json();
                    showMessage(err.error || 'Failed to delete user.', true);
                }
            });
        });
    }

    // Contextual Help Triggers
    document.querySelectorAll('.section-help-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openHelpModal(btn.dataset.topic);
        });
    });

    // Save Live Rules Form
    document.getElementById('rules-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            min_username_length: parseInt(document.getElementById('rule-min-user').value, 10),
            max_username_length: parseInt(document.getElementById('rule-max-user').value, 10),
            min_password_length: parseInt(document.getElementById('rule-min-pass').value, 10),
            require_uppercase: document.getElementById('rule-require-upper').checked,
            require_number: document.getElementById('rule-require-num').checked,
            require_special_char: document.getElementById('rule-require-spec').checked,
            flag_legacy_users: false
        };

        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/admin/auth/rules', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message);
            loadRules();
        } else {
            showMessage(data.error || 'Failed to update rules.', true);
        }
    });

    // Enforce Production Standards & 30-day compliance flag
    document.getElementById('enforce-prod-btn').addEventListener('click', async () => {
        if (!confirm('This will bump the credentials requirement to production standards (8+ chars, upper, number, special char) and flag non-compliant users for deletion/rename in 30 days. Proceed?')) return;

        const payload = {
            min_username_length: 3,
            max_username_length: 30,
            min_password_length: 8,
            require_uppercase: true,
            require_number: true,
            require_special_char: true,
            flag_legacy_users: true
        };

        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/admin/auth/rules', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showMessage(data.message);
            loadRules();
            loadUsers();
        } else {
            showMessage(data.error || 'Failed to enforce production standards.', true);
        }
    });

    // Modal Triggers
    const openCreateBtn = document.getElementById('open-create-modal');
    if (openCreateBtn) openCreateBtn.addEventListener('click', () => { modal.style.display = 'flex'; });

    const closeCreateBtn = document.getElementById('close-create-modal');
    if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => { modal.style.display = 'none'; });

    // Create User Form
    document.getElementById('create-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('new-username').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;
        const token = localStorage.getItem('auth_token');

        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ username, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            modal.style.display = 'none';
            document.getElementById('create-user-form').reset();
            showMessage('User created.');
            loadUsers();
        } else {
            showMessage(data.error || 'Failed to create user.', true);
        }
    });

    loadRules();
    loadUsers();
}

export function cleanup() {}