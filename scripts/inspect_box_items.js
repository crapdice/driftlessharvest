const db = require('../server/db');

console.log("--- Box Items Inspection ---");
const items = db.prepare(`
    SELECT bi.rowid, bi.box_template_id, bi.product_id, bi.quantity, p.name, p.id as real_p_id 
    FROM box_items bi 
    LEFT JOIN products p ON bi.product_id = p.id 
    ORDER BY bi.box_template_id, bi.product_id
`).all();

items.forEach(i => {
    console.log(`RowID: ${i.rowid} | Box: ${i.box_template_id} | ProdID: ${i.product_id} | Qty: ${i.quantity} | Name: ${i.name || 'NULL'} | RealID: ${i.real_p_id}`);
});
