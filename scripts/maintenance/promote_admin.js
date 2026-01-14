const Database = require('better-sqlite3');
const db = new Database('harvest.db');

try {
    // Promote the most recent user to 'admin'
    const user = db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT 1').get();
    if (user) {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
        console.log(`Promoted user ${user.email} (ID: ${user.id}) to ADMIN.`);
    } else {
        console.log('No users found to promote.');
    }
} catch (e) {
    console.error('Failed to promote user:', e);
}
