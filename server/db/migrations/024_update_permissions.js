module.exports = {
    up: (db) => {
        console.log('[Migration 024] Updating Admin Permissions...');

        const delivery = [
            "view_delivery_calendar",
            "view_delivery_routes",
            "update_delivery_status"
        ];

        const manager = [
            ...delivery,
            "manage_products",
            "manage_orders",
            "manage_customers"
        ];

        const owner = [
            ...manager,
            "manage_all",
            "view_financials"
        ];

        // Admin inherits all from Owner EXCEPT view_financials
        const admin = owner.filter(p => p !== 'view_financials');

        const superadmin = ["*"];

        const updates = [
            { name: 'store_delivery', perms: JSON.stringify(delivery) },
            { name: 'store_manager', perms: JSON.stringify(manager) },
            { name: 'store_owner', perms: JSON.stringify(owner) },
            { name: 'admin', perms: JSON.stringify(admin) },
            { name: 'superadmin', perms: JSON.stringify(superadmin) }
        ];

        const stmt = db.prepare('UPDATE admin_types SET permissions = @perms WHERE name = @name');

        updates.forEach(u => {
            stmt.run({ perms: u.perms, name: u.name });
            console.log(`  -> Updated ${u.name}`);
        });

        console.log('[Migration 024] Complete.');
    }
};
