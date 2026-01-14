const validate = (schema) => (req, res, next) => {
    try {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            console.error('Validation Failed Debug:', JSON.stringify(result, null, 2));
            const issues = (result.error && result.error.errors) || [];
            const errors = issues.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            return res.status(400).json({ error: 'Validation Failed', details: errors });
        }

        // Replace req.body with the sanitized/transformed data
        req.body = result.data;
        next();
    } catch (err) {
        console.error('Validation Middleware Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = validate;
