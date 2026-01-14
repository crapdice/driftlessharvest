import { toTitleCase } from './utils.js';

/**
 * Validates and constructs a standardized Order object.
 * This ensures that ANY order sent to the server meets the strict schema requirements.
 * 
 * @param {Object} input - Raw input values from the form
 * @param {Object} state - Current application state (cart, user)
 * @returns {Object} Standardized Order Payload
 * @throws {Error} If validation fails
 */
export function createOrderPayload(input, state) {
    // 1. Validate Required Fields
    const required = ['name', 'email', 'street', 'city', 'zip', 'date'];
    const missing = required.filter(field => !input[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // 2. Validate Data Integrity
    if (state.cart.length === 0) {
        throw new Error("Cart is empty");
    }

    // 3. Standardization (The "Shared Contract")
    // We strictly enforce Title Case for addresses to keep the Admin Panel clean.
    const shippingDetails = {
        name: toTitleCase(input.name),
        email: input.email.toLowerCase().trim(), // Standardize email
        street: toTitleCase(input.street),
        city: toTitleCase(input.city),
        state: input.state ? input.state.toUpperCase().slice(0, 2) : '', // Force 2-char State Code if possible, or Upper
        zip: input.zip.trim(),
        phone: input.phone ? input.phone.trim() : '',
        delivery_window: input.date
    };

    // 4. Construct Payload
    // This matches EXACTLY what the server expects.
    return {
        user_email: shippingDetails.email,
        shipping_details: {
            name: shippingDetails.name,
            phone: shippingDetails.phone
        },
        items: state.cart.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            type: item.type
        })),
        total: state.cart.reduce((s, i) => s + (i.price * i.qty), 0),

        // This 'shipping' object is what the server decomposes into the DB
        shipping: {
            street: shippingDetails.street,
            city: shippingDetails.city,
            state: shippingDetails.state,
            zip: shippingDetails.zip,
            date: shippingDetails.delivery_window,
            phone: shippingDetails.phone
        }
    };
}
