/**
 * Seed Data - Default Products and Box Templates
 * This data is seeded on startup if the tables are empty.
 */

const SEED_PRODUCTS = [
    {
        name: 'Heirloom Tomatoes',
        category: 'vegetable',
        price: 4.00,
        image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300',
        tags: '["local","seasonal"]',
        stock: 25,
        is_active: 1
    },
    {
        name: 'Honeycrisp Apples',
        category: 'fruit',
        price: 3.50,
        image_url: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=300',
        tags: '["fruit","sweet","seasonal"]',
        stock: 30,
        is_active: 1
    },
    {
        name: 'Farm Fresh Eggs (Dozen)',
        category: 'protein',
        price: 6.00,
        image_url: 'https://images.unsplash.com/photo-1559229873-383d75ba200f?auto=format&fit=crop&q=80&w=300',
        tags: '["local","free-range"]',
        stock: 20,
        is_active: 1
    },
    {
        name: 'Sourdough Bread',
        category: 'pantry',
        price: 7.00,
        image_url: 'https://images.unsplash.com/photo-1613396874083-2d5fbe59ae79?auto=format&fit=crop&q=80&w=300',
        tags: '["bakery","fresh"]',
        stock: 15,
        is_active: 1
    },
    {
        name: 'Rainbow Carrots',
        category: 'vegetable',
        price: 3.00,
        image_url: 'https://images.unsplash.com/photo-1580716685595-98bd80bf3c01?auto=format&fit=crop&q=80&w=300',
        tags: '["organic","root"]',
        stock: 40,
        is_active: 1
    },
    {
        name: 'Organic Kale',
        category: 'vegetable',
        price: 2.50,
        image_url: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&q=80&w=300',
        tags: '["organic","green"]',
        stock: 35,
        is_active: 1
    },
    {
        name: 'Local Honey (16oz)',
        category: 'pantry',
        price: 12.00,
        image_url: 'https://images.unsplash.com/photo-1629240830845-e4a550a6bbde?auto=format&fit=crop&q=80&w=300',
        tags: '["local","sweet"]',
        stock: 10,
        is_active: 1
    }
];

const SEED_BOX_TEMPLATES = [
    {
        name: 'Family Harvest Box',
        description: 'A generous selection of seasonal vegetables and staples perfect for family meals throughout the week.',
        base_price: 38.00,
        image_url: 'https://images.unsplash.com/photo-1690067698023-54d7ba7a1619?auto=format&fit=crop&q=80&w=600',
        is_active: 1,
        items: [1, 2, 3, 5, 6] // Product indices (1-based)
    },
    {
        name: "Couple's Box",
        description: 'Perfectly sized for two people. Fresh produce and pantry items without the excess.',
        base_price: 26.00,
        image_url: 'https://images.unsplash.com/photo-1607237896259-191316556483?auto=format&fit=crop&q=80&w=600',
        is_active: 1,
        items: [1, 5, 6]
    },
    {
        name: 'Viroqua Summer Box',
        description: 'Seasonal vegetables grown around Viroqua. Contents reflect what is thriving locally.',
        base_price: 32.00,
        image_url: 'https://images.unsplash.com/photo-1749997462936-c5d69337059f?auto=format&fit=crop&q=80&w=600',
        is_active: 1,
        items: [1, 2, 5, 7]
    },
    {
        name: 'Ridge & Valley Artisan Box',
        description: 'Emphasizing independent makers and value-added foods alongside seasonal produce.',
        base_price: 55.00,
        image_url: 'https://images.unsplash.com/photo-1658581754423-087ed5459550?auto=format&fit=crop&q=80&w=600',
        is_active: 1,
        items: [3, 4, 6, 7]
    }
];

module.exports = { SEED_PRODUCTS, SEED_BOX_TEMPLATES };
