const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node make_migration.js <migration_name>');
    process.exit(1);
}

const name = args.join('_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14); // YYYYMMDDHHMMSS? 
// No, existing migrations use sequential numbers (001, 002).
// Let's find the next sequence number.

const migrationsDir = path.join(__dirname, '../../server/db/migrations');
if (!fs.existsSync(migrationsDir)) fs.mkdirSync(migrationsDir, { recursive: true });

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.js'));
let lastNum = 0;

files.forEach(f => {
    const match = f.match(/^(\d+)_/);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num > lastNum) lastNum = num;
    }
});

const nextNum = (lastNum + 1).toString().padStart(3, '0');
const fileName = `${nextNum}_${name}.js`;
const filePath = path.join(migrationsDir, fileName);

const template = `exports.up = function (db) {
    // db.prepare("...").run();
}

exports.down = function (db) {
    // db.prepare("...").run();
}
`;

fs.writeFileSync(filePath, template);
console.log(`Created migration: ${fileName}`);
