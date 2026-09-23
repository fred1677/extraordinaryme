/**
 * ============================================================================
 * MODULE: /backend/db/schema.sql
 * 
 * FUNCTION: 
 * This is the Master Blueprint for the TAO OS database. 
 * If you ever need to move TAO OS to a brand new server, running this single 
 * file will completely rebuild the entire database architecture from scratch.
 * ============================================================================
 */

-- This turns on a special PostgreSQL tool that allows us to securely scramble 
-- (hash) user passwords so they are never saved as plain text.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/**
 * =========================================================================
 * >>> 1. THE USER DIRECTORY (Identity & State) <<<
 * =========================================================================
 * Think of this as the master address book. Every single person who registers
 * gets a row in this table. It holds their login info, their security clearance,
 * and remembers where they left off during their last session.
 */
CREATE TABLE users (
    -- 'id' is a unique, random string of numbers and letters (UUID) so we don't rely on predictable numbers like 1, 2, 3.
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,                  
    email VARCHAR(255) UNIQUE NOT NULL,                    
    password_hash VARCHAR(255) NOT NULL, -- The scrambled, unreadable password                 
    session_token VARCHAR(255) UNIQUE,   -- A temporary digital VIP wristband for staying logged in         
    
    -- FRONTEND SECURITY TIER: Everyone starts as an 'Explorer' (Standard User)
    designation VARCHAR(255) NOT NULL DEFAULT 'Explorer', 
    
    -- ZERO-TRUST BACKEND SECURITY: The "Taouser" Firewall
    -- 'is_taouser': If false, they are stuck in the frontend waiting room. If true, they can access backend apps.
    is_taouser BOOLEAN DEFAULT false,
    -- 'tao_roles': A list of their job titles (e.g., ['Master', 'Speaker']). Defaults to empty.
    tao_roles TEXT[] DEFAULT '{}',
    -- 'requires_password_change': If true, forces the user to pick a new password before they can log in.
    requires_password_change BOOLEAN DEFAULT false,
    
    -- OS PREFERENCES: Remembers how they like their desktop set up
    restore_session BOOLEAN DEFAULT TRUE,         
    last_session_state JSONB DEFAULT '{}'::jsonb,
    user_flags JSONB DEFAULT '{}'::jsonb,                               
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * =========================================================================
 * >>> 1.5 THE RULES DICTIONARY (Zero-Trust RBAC) <<<
 * =========================================================================
 * These tables control what "Taousers" are actually allowed to do. 
 * Instead of hardcoding rules, admins can create roles here dynamically.
 */

-- The Titles: A list of official job names (e.g., "Senior-Master", "HH-Host").
CREATE TABLE system_roles (
    role_name VARCHAR(50) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- The Permissions: Connects a Title to a specific superpower.
-- E.g., Role: "HH-Host" -> Ability: "CAN_START_EVENT"
CREATE TABLE system_abilities (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) REFERENCES system_roles(role_name) ON DELETE CASCADE,
    ability_name VARCHAR(100),
    UNIQUE(role_name, ability_name) -- Ensures we don't give the exact same power to the exact same role twice
);

/**
 * =========================================================================
 * >>> 2. THE SYSTEM ACCOUNTS (The Founders) <<<
 * =========================================================================
 * We automatically inject these two accounts into the database so the system 
 * is never completely locked. TAO_SYSTEM is the automated robot owner of core 
 * files, and 'admin' is a fallback human account.
 */
INSERT INTO users (id, username, email, password_hash, designation, is_taouser)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'TAO_SYSTEM', 
    'system@taoos.local', 
    'LOCKED', 
    'System',
    true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (username, email, password_hash, designation, is_taouser)
VALUES (
    'admin', 
    'admin@taoos.local', 
    '12345', 
    'System',
    true
) ON CONFLICT (username) DO NOTHING;

/**
 * =========================================================================
 * >>> 3. THE UNIVERSAL FILE CABINET (User Modules) <<<
 * =========================================================================
 * Traditional computers use strict "folders" and "files". TAO OS uses a 
 * "Fractal Tree" where everything (a chat log, a health app, a window design) 
 * is just an object connected to a parent object. This table stores ALL of it.
 */
CREATE TABLE user_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Who owns this file?
    parent_id UUID REFERENCES user_modules(id) ON DELETE CASCADE,  -- What folder/object does this live inside?
    node_type VARCHAR(50) NOT NULL,               
    name VARCHAR(255) NOT NULL,
    ui_state JSONB NOT NULL DEFAULT '{}'::jsonb, -- Stores colors, sizes, and layout settings           
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- "Indexes" are like bookmarks in a textbook. They make it lighting fast for 
-- the database to search for files based on who owns them or what layer they are on.
CREATE INDEX idx_module_owner ON user_modules(owner_id);
CREATE INDEX idx_module_parent ON user_modules(parent_id);
CREATE INDEX idx_module_layer ON user_modules USING gin ((ui_state -> 'layer'));
CREATE INDEX idx_module_namespace ON user_modules USING gin ((ui_state -> 'namespace'));

/**
 * =========================================================================
 * >>> 4. THE BLACK BOX (System Logs) <<<
 * =========================================================================
 * This is the system's diary. It records every major event, error, or action
 * taken by a user so admins can audit the system if something breaks.
 */
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    module_name VARCHAR(100) DEFAULT 'system',
    message TEXT NOT NULL,
    log_type VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_module ON system_logs(module_name);
CREATE INDEX idx_system_logs_time ON system_logs(created_at DESC);

/**
 * =========================================================================
 * >>> 5. THE WELCOME ROBOT (Automatic Genesis Trigger) <<<
 * =========================================================================
 * A "Trigger" is an automated database robot. The moment a new user finishes 
 * registering, this script instantly runs in the background. It builds their 
 * personal "Root Universe" and sets up all their desktop layers (2 through 6)
 * so their workspace is ready the exact second they log in.
 */
CREATE OR REPLACE FUNCTION provision_user_genesis_block()
RETURNS TRIGGER AS $$
DECLARE
    root_id UUID;
    layer2_id UUID;
    layer3_id UUID;
    layer4_id UUID;
    layer5_id UUID;
    layer6_id UUID;
BEGIN
    -- 1. Create the Master Root folder for the new user
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (
        NEW.id, NULL, 'universe', 'Root Universe',
        jsonb_build_object('description', 'Master Root Directory for ' || NEW.username, 'version', '1.0.0', 'is_root', true)
    ) RETURNING id INTO root_id;

    -- 2. Create the Layer 2 Workspace (The Desktop)
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 2 User Workspace', jsonb_build_object('layer', 2.0, 'namespace', 'layer-2-base', 'highest_active_sublayer', 2.0))
    RETURNING id INTO layer2_id;

    -- 3. Create Layer 3 (The Pull-out Drawers)
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 3 Drawers', jsonb_build_object('layer', 3.0, 'namespace', 'layer-3-drawers', 'active_drawers', '[]'::jsonb))
    RETURNING id INTO layer3_id;

    -- 4. Create Layer 4 (AI Overlays)
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 4 AI Overlays', jsonb_build_object('layer', 4.0, 'namespace', 'layer-4-ai', 'active_overlays', '[]'::jsonb))
    RETURNING id INTO layer4_id;

    -- 5. Create Layer 5 (System Chrome - Top and Bottom Bars)
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 5 System Chrome', jsonb_build_object('layer', 5.0, 'namespace', 'layer-5-chrome', 'components', '["top-bar", "bottom-bar"]'::jsonb))
    RETURNING id INTO layer5_id;

    -- 6. Create Layer 6 (The Secure Lockscreen)
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 6 Lockscreen', jsonb_build_object('layer', 6.0, 'namespace', 'layer-6-lockscreen', 'is_secure', true))
    RETURNING id INTO layer6_id;

    -- 7. Save all these new layer IDs to the user's profile so the OS knows where to look
    UPDATE users
    SET last_session_state = jsonb_build_object(
        'root_id', root_id, 'layer_2_id', layer2_id, 'layer_3_id', layer3_id, 
        'layer_4_id', layer4_id, 'layer_5_id', layer5_id, 'layer_6_id', layer6_id, 
        'active_layer', 2.0
    )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the Welcome Robot to the Users table
CREATE TRIGGER trg_user_genesis
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION provision_user_genesis_block();

/**
 * =========================================================================
 * >>> 6. HEALTH & TRACKING (System Metrics Registry) <<<
 * =========================================================================
 * This is where we store data that happens over time (like tracking sleep or 
 * blood pressure). The 'registry' table defines WHAT we can track, and the 
 * 'user_metrics' table stores the ACTUAL logged numbers for a user on a specific day.
 */
CREATE TABLE system_metric_registry (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    expected_schema JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_data JSONB NOT NULL,
    log_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_metrics_lookup ON user_metrics(user_id, metric_name, log_date DESC);

/**
 * =========================================================================
 * >>> 7. THE BILLBOARD (Monetization & Ad Inventory) <<<
 * =========================================================================
 * Stores the advertisements shown to free-tier 'Explorer' users. Upgraded 
 * accounts bypass this database table entirely.
 */
CREATE TABLE ad_inventory (
    id SERIAL PRIMARY KEY,
    campaign VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'external',
    headline VARCHAR(50) NOT NULL,
    subtext VARCHAR(60) NOT NULL,
    target_url TEXT,
    bg_color VARCHAR(10) DEFAULT '#050505',
    text_color VARCHAR(10) DEFAULT '#ffffff',
    internal_page_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Establish the permanent system fallback ad to guarantee free-tier rendering
-- if no external ads are loaded.
INSERT INTO ad_inventory (campaign, type, headline, subtext, target_url, bg_color, text_color, internal_page_content)
VALUES (
    'TAO OS Pro Upgrade', 
    'internal', 
    'Unlock Your Full Workspace.', 
    'Upgrade to TAO Pro to remove ads permanently.', 
    'tao-upgrade-screen', 
    '#050505', 
    '#ffd700', 
    '<h2>TAO OS Professional</h2><p>Upgrade your account to remove the top banner and unlock the full potential of your workspace geometry.</p>'
);