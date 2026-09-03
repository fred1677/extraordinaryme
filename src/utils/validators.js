// src/utils/validators.js
const AUTH_RULES = {
    minUsernameLength: 3,
    maxUsernameLength: 30,
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true
};

function validateRegistration({ username, email, password }) {
    const userStr = String(username || '').trim();
    const passStr = String(password || '');

    if (!userStr || userStr.length < AUTH_RULES.minUsernameLength) {
        return `Username must be at least ${AUTH_RULES.minUsernameLength} characters long.`;
    }

    if (userStr.length > AUTH_RULES.maxUsernameLength) {
        return `Username cannot exceed ${AUTH_RULES.maxUsernameLength} characters.`;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(userStr)) {
        return 'Username can only contain alphanumeric characters, underscores, and hyphens.';
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailPattern.test(String(email).trim())) {
        return 'Please provide a valid email address.';
    }

    if (!passStr || passStr.length < AUTH_RULES.minPasswordLength) {
        return `Password must be at least ${AUTH_RULES.minPasswordLength} characters long.`;
    }

    if (AUTH_RULES.requireUppercase && !/[A-Z]/.test(passStr)) {
        return 'Password must contain at least one uppercase letter (A-Z).';
    }

    if (AUTH_RULES.requireNumber && !/[0-9]/.test(passStr)) {
        return 'Password must contain at least one numeric digit (0-9).';
    }

    if (AUTH_RULES.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passStr)) {
        return 'Password must contain at least one special character.';
    }

    return null;
}

// Runtime dynamic rule validator used by server.js line 114
function validateCredentialsWithRules(arg1, arg2, arg3) {
    let username = '';
    let password = '';
    let rules = {};

    // Support both validateCredentialsWithRules({ username, password }, rules)
    // and validateCredentialsWithRules(username, password, rules)
    if (typeof arg1 === 'object' && arg1 !== null) {
        username = String(arg1.username || '').trim();
        password = String(arg1.password || '');
        rules = typeof arg2 === 'object' && arg2 !== null ? arg2 : {};
    } else {
        username = String(arg1 || '').trim();
        password = String(arg2 || '');
        rules = typeof arg3 === 'object' && arg3 !== null ? arg3 : {};
    }

    const minUser = rules.min_username_length || AUTH_RULES.minUsernameLength;
    const maxUser = rules.max_username_length || AUTH_RULES.maxUsernameLength;
    const minPass = rules.min_password_length || AUTH_RULES.minPasswordLength;
    const reqUpper = rules.require_uppercase !== undefined ? rules.require_uppercase : AUTH_RULES.requireUppercase;
    const reqNum = rules.require_number !== undefined ? rules.require_number : AUTH_RULES.requireNumber;
    const reqSpec = rules.require_special_char !== undefined ? rules.require_special_char : AUTH_RULES.requireSpecialChar;

    if (!username || username.length < minUser) {
        return { valid: false, error: `Username must be at least ${minUser} characters long.` };
    }

    if (username.length > maxUser) {
        return { valid: false, error: `Username cannot exceed ${maxUser} characters.` };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens.' };
    }

    if (!password || password.length < minPass) {
        return { valid: false, error: `Password must be at least ${minPass} characters long.` };
    }

    if (reqUpper && !/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
    }

    if (reqNum && !/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one numeric digit (0-9).' };
    }

    if (reqSpec && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one special character.' };
    }

    return { valid: true, error: null };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AUTH_RULES,
        validateRegistration,
        validateCredentialsWithRules
    };
}