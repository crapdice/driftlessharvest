const z = require('zod');

// --- Reusable Field Schemas ---

const emailSchema = z.string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" });

// Phone: Strip all non-digits
const phoneSchema = z.string()
    .transform(val => (val || '').replace(/\D/g, ''))
    .pipe(z.string())
    .optional();

const addressSchema = z.object({
    street: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional(),
    phone: phoneSchema
}).optional();

// --- Route Schemas ---

const signupSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    phone: phoneSchema
});

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, { message: "Password is required" })
});

const updateProfileSchema = z.object({
    email: emailSchema,
    firstName: z.string().trim().min(1, { message: "First name is required" }),
    lastName: z.string().trim().min(1, { message: "Last name is required" }),
    phone: phoneSchema,
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional(),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    password: z.string().min(8).optional().or(z.literal(''))
});

// --- Admin Schemas ---

const createUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    role: z.string().min(1, { message: "Role is required" }), // e.g., 'user', 'admin'
    firstName: z.string().optional(), // Admin form might not send names?
    lastName: z.string().optional(),
    phone: phoneSchema,
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional()
});

const updateUserSchema = z.object({
    email: emailSchema,
    role: z.string().min(1, { message: "Role is required" }),
    phone: phoneSchema,
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zip: z.string().trim().optional()
});

const orderStatusSchema = z.object({
    status: z.enum(['Pending Payment', 'Payment Failed', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Canceled'], {
        errorMap: () => ({ message: "Invalid status value" })
    })
});

const deliveryWindowSchema = z.object({
    date_label: z.string().min(1),
    date_value: z.string().min(1)
});

const orderItemSchema = z.object({
    id: z.custom((val) => typeof val === 'string' || typeof val === 'number', "ID must be string or number"),
    qty: z.coerce.number().int().positive(),
    name: z.string().optional(),
    price: z.coerce.number().optional(),
    type: z.string().optional()
});

const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, { message: "Order must have items" }),
    user_email: emailSchema.or(z.literal('')).optional(),
    userEmail: emailSchema.or(z.literal('')).optional(),
    total: z.coerce.number().optional(),
    shipping: z.object({
        street: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z.string().trim().optional(),
        zip: z.string().trim().optional(),
        phone: phoneSchema,
        date: z.string().optional()
    }).optional(),
    shipping_details: z.object({
        name: z.string().trim().optional(),
        phone: phoneSchema
    }).optional(),
    deliveryWindow: z.string().optional()
});

module.exports = {
    signupSchema,
    loginSchema,
    updateProfileSchema,
    updateUserSchema,
    orderStatusSchema,
    deliveryWindowSchema,
    createOrderSchema
};
