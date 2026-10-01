/**
 * ============================================================================
 * MODULE: /backend/db/schema.sql
 * 
 * FUNCTION: 
 * This is the Master Blueprint for the Me OS database. 
 * If you ever need to move Me OS to a brand new server, running this single 
 * file will completely rebuild the entire database architecture from scratch.
 * ============================================================================
 */

-- This turns on a special PostgreSQL tool that allows us to securely scramble 
-- (hash) user passwords so they are never saved as plain text.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/**
 * =========================================================================
 * >>> 1. THE USER DIRECTORY (Identity, Billing & State) <<<
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
    
    -- 🚀 SUBSCRIPTIONS & PRICING TIERS
    -- Tiers: 'Free' (Ads/50MB), 'Pro' ($19.95/No Ads/BYOC), 'Gold' ($23.88/yr/100GB R2)
    account_tier VARCHAR(50) DEFAULT 'Free', 
    is_annual_billing BOOLEAN DEFAULT false,
    subscription_id VARCHAR(255), -- Links to Stripe/PayPal recurring charges

    -- 🚀 CLOUD STORAGE LEDGER (50MB Free Tier Default = 52428800 bytes, Gold = 107374182400 bytes)
    storage_limit_bytes BIGINT DEFAULT 52428800,
    storage_used_bytes BIGINT DEFAULT 0,

    -- ZERO-TRUST BACKEND SECURITY: The "Taouser" Firewall (Internal System Naming)
    is_taouser BOOLEAN DEFAULT false,
    tao_roles TEXT[] DEFAULT '{}',
    requires_password_change BOOLEAN DEFAULT false,
    
    -- OS PREFERENCES: Remembers how they like their desktop set up
    restore_session BOOLEAN DEFAULT TRUE,         
    last_session_state JSONB DEFAULT '{}'::jsonb,
    
    -- 🚀 Flags can now store BYOC preferences like {"storage_preference": "gdrive"}
    user_flags JSONB DEFAULT '{}'::jsonb,                               
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/**
 * =========================================================================
 * >>> 1.5 THE RULES DICTIONARY (Zero-Trust RBAC) <<<
 * =========================================================================
 * These tables control what internal administrative users are actually allowed 
 * to do. Instead of hardcoding rules, admins can create roles here dynamically.
 */
CREATE TABLE system_roles (
    role_name VARCHAR(50) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_abilities (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) REFERENCES system_roles(role_name) ON DELETE CASCADE,
    ability_name VARCHAR(100),
    UNIQUE(role_name, ability_name)
);

/**
 * =========================================================================
 * >>> 2. THE SYSTEM ACCOUNTS (The Founders) <<<
 * =========================================================================
 * We automatically inject these two accounts into the database so the system 
 * is never completely locked. TAO_SYSTEM is the automated robot owner of core 
 * files, and 'admin' is a fallback human account.
 */
INSERT INTO users (id, username, email, password_hash, designation, is_taouser, account_tier)
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'TAO_SYSTEM', 
    'system@meos.local', 
    'LOCKED', 
    'System',
    true,
    'Gold'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (username, email, password_hash, designation, is_taouser, account_tier)
VALUES (
    'admin', 
    'admin@meos.local', 
    '12345', 
    'System',
    true,
    'Gold'
) ON CONFLICT (username) DO NOTHING;

/**
 * =========================================================================
 * >>> 3. THE UNIVERSAL FILE CABINET (User Modules) <<<
 * =========================================================================
 * Traditional computers use strict "folders" and "files". Me OS uses a 
 * "Fractal Tree" where everything (a chat log, a health app, a window design) 
 * is just an object connected to a parent object. This table stores ALL of it.
 */
CREATE TABLE user_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    parent_id UUID REFERENCES user_modules(id) ON DELETE CASCADE,  
    node_type VARCHAR(50) NOT NULL,               
    name VARCHAR(255) NOT NULL,
    ui_state JSONB NOT NULL DEFAULT '{}'::jsonb,           
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
 * personal "Root Universe" and sets up all their desktop layers.
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
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, NULL, 'universe', 'Root Universe', jsonb_build_object('description', 'Master Root Directory for ' || NEW.username, 'version', '1.0.0', 'is_root', true))     
    RETURNING id INTO root_id;      
    
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 2 User Workspace', jsonb_build_object('layer', 2.0, 'namespace', 'layer-2-base', 'highest_active_sublayer', 2.0))     
    RETURNING id INTO layer2_id;      
    
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 3 Drawers', jsonb_build_object('layer', 3.0, 'namespace', 'layer-3-drawers', 'active_drawers', '[]'::jsonb))     
    RETURNING id INTO layer3_id;      
    
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 4 AI Overlays', jsonb_build_object('layer', 4.0, 'namespace', 'layer-4-ai', 'active_overlays', '[]'::jsonb))     
    RETURNING id INTO layer4_id;      
    
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 5 System Chrome', jsonb_build_object('layer', 5.0, 'namespace', 'layer-5-chrome', 'components', '["top-bar", "bottom-bar"]'::jsonb))     
    RETURNING id INTO layer5_id;      
    
    INSERT INTO user_modules (owner_id, parent_id, node_type, name, ui_state)     
    VALUES (NEW.id, root_id, 'galaxy', 'Layer 6 Lockscreen', jsonb_build_object('layer', 6.0, 'namespace', 'layer-6-lockscreen', 'is_secure', true))     
    RETURNING id INTO layer6_id;      
    
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
    
    -- 🚀 BYOC UPDATE: Agnostic tracking. Can be an R2 S3 Key OR a Google Drive File ID
    provider_file_id TEXT NOT NULL, 
    
    log_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_metrics_lookup ON user_metrics(user_id, metric_name, log_date DESC);

/**
 * =========================================================================
 * >>> 7. THE BILLBOARD (Monetization & Ad Inventory) <<<
 * =========================================================================
 * Stores the advertisements shown to free-tier 'Explorer' users. Upgraded 
 * accounts (Pro & Gold) bypass this database table entirely.
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

INSERT INTO ad_inventory (campaign, type, headline, subtext, target_url, bg_color, text_color, internal_page_content)
VALUES (
    'Me OS Pro Upgrade', 
    'internal', 
    'Unlock Your Full Workspace.', 
    'Upgrade to Me Pro to remove ads permanently.', 
    'tao-upgrade-screen', 
    '#050505', 
    '#ffd700', 
    '<h2>Me OS Professional</h2><p>Upgrade your account to remove the top banner and unlock the full potential of your workspace geometry.</p>'
);

/**
 * =========================================================================
 * >>> 8. THE APP REGISTRY (Database-Driven Desktop & App Manager) <<<
 * =========================================================================
 * This table serves as the master software catalog for Me OS.
 */
CREATE TABLE system_applications (
    id SERIAL PRIMARY KEY,
    app_name VARCHAR(50) UNIQUE NOT NULL,                     
    icon_path TEXT NOT NULL,                                  
    js_file_path VARCHAR(255) NOT NULL,                       
    minimum_clearance VARCHAR(50) DEFAULT 'Members',          
    is_active BOOLEAN DEFAULT true,                           
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_apps_clearance ON system_applications(minimum_clearance);
CREATE INDEX idx_system_apps_active ON system_applications(is_active);

INSERT INTO system_applications (app_name, icon_path, js_file_path, minimum_clearance)
VALUES (
    'App Manager', 
    '/assets/icons/app-manager.png', 
    '../src/Universe/Me/galaxy/System/AppManager.js', 
    'Master'
) ON CONFLICT (app_name) DO NOTHING;

/**
 * =========================================================================
 * >>> 9. THE ICON REGISTRY (Dynamic Icon Library) <<<
 * =========================================================================
 */
CREATE TABLE system_icons (
    icon_name VARCHAR(50) PRIMARY KEY,
    svg_string TEXT NOT NULL
);

INSERT INTO system_icons (icon_name, svg_string) VALUES 
    ('App / Grid', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'),
    ('Profile / User', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'),
    ('Settings / Gear', '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'),
    ('Me / Main', '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>'),
    ('Heart / Red', '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'),
    ('Mail / Blue', '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>'),
    ('Chat / Purple', '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'),
    ('Ad / Yellow', '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="12" rx="2" ry="2"></rect><path d="M12 16v4"></path><path d="M8 20h8"></path></svg>');

/**
 * =========================================================================
 * >>> 10. 🚀 THE VIRTUAL FILE SYSTEM (Cloud Drive & BYOC Support) <<<
 * =========================================================================
 * This table acts as the unified map for user files, whether they are stored 
 * natively in Cloudflare R2, or inside an external linked Google Drive.
 */
CREATE TABLE cloud_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- NULL means it sits at the absolute root directory.
    parent_folder_id UUID REFERENCES cloud_files(id) ON DELETE CASCADE, 
    
    filename VARCHAR(255) NOT NULL,
    
    -- 🚀 BYOC UPDATE: Tracks the storage location ('r2' or 'gdrive') and the specific remote ID
    storage_provider VARCHAR(50) DEFAULT 'r2', 
    provider_file_id TEXT UNIQUE NOT NULL, 
    
    size_bytes BIGINT NOT NULL DEFAULT 0,
    
    -- If true, this belongs to an OS app (like a profile pic) and is hidden from the user's File Explorer
    is_system_file BOOLEAN DEFAULT false, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cloud_files_owner ON cloud_files(owner_id);
CREATE INDEX idx_cloud_files_parent ON cloud_files(parent_folder_id);
CREATE INDEX idx_cloud_files_system ON cloud_files(is_system_file);