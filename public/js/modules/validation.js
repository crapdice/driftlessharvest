
/**
 * Validation Logic Module
 */

export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

export function validateZip(zip) {
    return /^\d{5}$/.test(String(zip));
}

export function validateSimplePhone(phone) {
    // optional: returns true if empty OR if 10 digits
    if (!phone) return true;
    const digits = phone.replace(/[^\d]/g, '');
    return digits.length === 10;
}

export function validateStreet(val) {
    if (!val) return false;
    const hasNumber = /\d/.test(val);
    const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
    return hasNumber && letterCount >= 2;
}

export function validateCity(val) {
    if (!val) return false;
    const letterCount = (val.match(/[a-zA-Z]/g) || []).length;
    return letterCount >= 2;
}

/**
 * Centralized Field Validator
 * @param {string} type - 'email', 'zip', 'phone', 'street', 'city', 'name', 'password', 'required'
 * @param {string} val - The value to validate
 * @returns {boolean}
 */
export function validateField(type, val) {
    if (val === null || val === undefined) val = '';
    val = String(val).trim();

    switch (type) {
        case 'email':
            return validateEmail(val);
        case 'zip':
            return validateZip(val);
        case 'phone':
            return validateSimplePhone(val);
        case 'street':
            return validateStreet(val);
        case 'city':
            return validateCity(val);
        case 'name': // First/Last Name
            return val.length >= 2;
        case 'password':
            return val.length === 0 || val.length >= 8;
        case 'required':
        default:
            return val.length > 0;
    }
}
