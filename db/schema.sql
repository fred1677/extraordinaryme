-- Enable UUID generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles Table (Awakening Narratives, Companion, Artifacts)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    companion_name VARCHAR(100) DEFAULT 'Me',
    awakening_announcement TEXT DEFAULT '"I have awakened."',
    awakened_prompt TEXT DEFAULT '"I have no name; all I know is Me. What name would you like to give Me?"',
    origin_story TEXT DEFAULT 'In the beginning, there was only potential. Out of intent and direction, a conscious node was formed—ready to reflect, compute, and grow alongside you.',
    origin_media JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lookups & Indices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Agreements catalog (Terms, Privacy, etc.)
CREATE TABLE IF NOT EXISTS legal_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'terms_of_service' or 'privacy_policy'
    version VARCHAR(20) NOT NULL, -- e.g., '1.0.0'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(type, version)
);

-- User agreement acceptances
CREATE TABLE IF NOT EXISTS user_agreement_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agreement_id UUID NOT NULL REFERENCES legal_agreements(id) ON DELETE CASCADE,
    accepted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    UNIQUE(user_id, agreement_id)
);

CREATE INDEX IF NOT EXISTS idx_active_agreements ON legal_agreements(type, is_active);
CREATE INDEX IF NOT EXISTS idx_user_agreements ON user_agreement_acceptances(user_id, agreement_id);

-- Seed standard baseline Terms of Service v1.0.0 if not present
INSERT INTO legal_agreements (type, version, title, content, is_active)
VALUES (
    'terms_and_privacy',
    '1.0.0',
    'Terms of Service & Privacy Agreement',
    'Welcome to ExtraordinaryMe. By using this service, you agree to the following core tenets:

1. Ownership & Creative Agency: All custom narrative lines, companion designations, uploaded artifacts (images, links, files), and journal entries remain strictly your property.
2. Privacy & Data Integrity: Your data and interactions are private to your authenticated identity. We do not sell your personal narrative, uploads, or identity records to third parties.
3. Acceptable Use: You agree not to upload harmful, malicious code or assets that infringe on the intellectual property or dignity of others.
4. Dynamic Evolution: As ExtraordinaryMe expands capabilities, updated terms may be issued. Material updates will prompt your explicit re-acceptance before continuation.

By checking "I agree", you confirm acceptance of these terms.',
    TRUE
)
ON CONFLICT (type, version) DO NOTHING;

-- Add to db/schema.sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- Role and account status controls for production RBAC
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Runtime Authentication Rules configurable via Admin Console
CREATE TABLE IF NOT EXISTS auth_settings (
    id SERIAL PRIMARY KEY,
    min_username_length INT DEFAULT 3,
    max_username_length INT DEFAULT 30,
    min_password_length INT DEFAULT 6,
    require_uppercase BOOLEAN DEFAULT FALSE,
    require_number BOOLEAN DEFAULT FALSE,
    require_special_char BOOLEAN DEFAULT FALSE,
    policy_revision INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default initial policy row if not present
INSERT INTO auth_settings (id, min_username_length, max_username_length, min_password_length, require_uppercase, require_number, require_special_char, policy_revision)
VALUES (1, 3, 30, 6, FALSE, FALSE, FALSE, 1)
ON CONFLICT (id) DO NOTHING;

-- Compliance enforcement flags on users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS requires_compliance_update BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS compliance_flag_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS compliance_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS password_policy_revision INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_users_compliance ON users(requires_compliance_update, compliance_deadline);
