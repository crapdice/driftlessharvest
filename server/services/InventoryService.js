const db = require('../db');

class InventoryService {
    /**
     * validates stock for a list of items (products or boxes).
     * Returns a list of failed items if any are out of stock.
     */
    validateStock(items) {
        const failedItems = [];
        const verifiedItems = [];
        let total = 0;

        for (const item of items) {
            if (item.type === 'box') {
                const boxResult = this._validateBox(item);
                if (boxResult.error) {
                    failedItems.push(boxResult.error);
                } else {
                    verifiedItems.push(boxResult.item);
                    total += boxResult.price;
                }
            } else {
                const productResult = this._validateProduct(item);
                if (productResult.error) {
                    failedItems.push(productResult.error);
                } else {
                    verifiedItems.push(productResult.item);
                    total += productResult.price;
                }
            }
        }

        return { failedItems, verifiedItems, total };
    }

    /**
     * Reserves stock for items.
     * Expects to be run within a transaction transaction.
     */
    reserveStock(items) {
        for (const item of items) {
            if (item.type === 'box') {
                this._decrementBoxStock(item);
            } else {
                this._decrementProductStock(item);
            }
        }
    }

    /**
     * Releases stock (e.g. on payment failure).
     */
    releaseStock(items) {
        for (const item of items) {
            if (item.type === 'box') {
                this._incrementBoxStock(item);
            } else {
                this._incrementProductStock(item);
            }
        }
    }

    // --- Private Helpers ---

    _validateBox(item) {
        const template = db.prepare('SELECT base_price, name FROM box_templates WHERE id = ?').get(item.id);
        if (!template) {
            return { error: { id: item.id, name: 'Unknown Box', error: 'Template not found' } };
        }

        const contents = db.prepare('SELECT product_id, quantity FROM box_items WHERE box_template_id = ?').all(item.id);

        for (const sub of contents) {
            const p = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(sub.product_id);
            const required = sub.quantity * (item.qty || 1);
            if (!p || p.stock < required) {
                return { error: { id: item.id, name: template.name, error: `Content ${p ? p.name : 'Unknown'} out of stock` } };
            }
        }

        return {
            item: { ...item, price: template.base_price, name: template.name, contents }, // Attach contents for reservation
            price: template.base_price * (item.qty || 1)
        };
    }

    _validateProduct(item) {
        const product = db.prepare('SELECT price, stock, name FROM products WHERE id = ?').get(item.id);
        if (!product) {
            return { error: { id: item.id, name: 'Unknown Item', error: 'Not found' } };
        }

        if (product.stock < (item.qty || 1)) {
            return { error: { id: item.id, name: product.name, error: 'Insufficient stock' } };
        }

        return {
            item: { ...item, price: product.price, name: product.name },
            price: product.price * (item.qty || 1)
        };
    }

    _decrementBoxStock(item) {
        // We re-fetch contents if not passed, but optimized flow passes them
        const contents = item.contents || db.prepare('SELECT product_id, quantity FROM box_items WHERE box_template_id = ?').all(item.id);
        for (const sub of contents) {
            db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(sub.quantity * (item.qty || 1), sub.product_id);
        }
    }

    _decrementProductStock(item) {
        db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run((item.qty || 1), item.id);
    }

    _incrementBoxStock(item) {
        const contents = db.prepare('SELECT product_id, quantity FROM box_items WHERE box_template_id = ?').all(item.id);
        for (const sub of contents) {
            db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(sub.quantity * (item.qty || 1), sub.product_id);
        }
    }

    _incrementProductStock(item) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run((item.qty || 1), item.id);
    }
}

module.exports = new InventoryService();
