const db = require('../server/db');

console.log("--- Analyzing Box Items ---");

// 1. Find Orphans (Items pointing to non-existent products)
const orphans = db.prepare(`
    SELECT bi.rowid, bi.box_template_id, bi.product_id 
    FROM box_items bi 
    LEFT JOIN products p ON bi.product_id = p.id 
    WHERE p.id IS NULL
`).all();

console.log(`Found ${orphans.length} ORPHANED items (No data).`);
orphans.forEach(o => console.log(`  - Delete rowid:${o.rowid} (Box: ${o.box_template_id}, Prod: ${o.product_id})`));

// 2. Find Duplicates (Same Box, Same Product)
const duplicates = db.prepare(`
    SELECT box_template_id, product_id, COUNT(*) as count 
    FROM box_items 
    GROUP BY box_template_id, product_id 
    HAVING count > 1
`).all();

console.log(`Found ${duplicates.length} DUPLICATE groups.`);
duplicates.forEach(d => {
    console.log(`  - Box ${d.box_template_id} has ${d.count} entries for Product ${d.product_id}`);
});

if (process.argv.includes('--fix')) {
    console.log("\n--- APPYLING FIXES ---");

    // Delete Orphans
    const delOrphan = db.prepare('DELETE FROM box_items WHERE rowid = ?');
    let deletedOrphans = 0;
    orphans.forEach(o => {
        delOrphan.run(o.rowid);
        deletedOrphans++;
    });
    console.log(`Deleted ${deletedOrphans} orphaned items.`);

    // Deduplicate? (Maybe user wants to keep the one with data? If duplicates implies valid items, we might just merge qty?)
    // User complaint: "two rows... one row displays no data".
    // This suggests the orphans ARE the problem.
    // If I fix the orphans, the "duplicate" visual might go away.
    // I will only fix orphans for now unless duplicates are also found.
}
