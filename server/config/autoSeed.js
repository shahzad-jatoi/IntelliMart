/**
 * Auto-seeder — runs on server startup if DB is empty.
 * Only seeds when using in-memory MongoDB (no data persistence).
 */
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');

const DATASET_DIR = path.join(__dirname, '..', '..', 'dataset', 'dataset');
const LIMIT_PER_CATEGORY = 50;

const CATEGORY_ICONS = {
  'Arts_Crafts_and_Sewing': '🎨', 'Automotive': '🚗', 'Baby': '👶',
  'Beauty': '💄', 'Books': '📚', 'CDs_and_Vinyl': '💿',
  'Cell_Phones_and_Accessories': '📱', 'Electronics': '🔌',
  'Grocery_and_Gourmet_Food': '🛒', 'Health_and_Personal_Care': '💊',
  'Home_and_Kitchen': '🏠', 'Industrial_and_Scientific': '🔬',
  'Movies_and_TV': '🎬', 'Office_Products': '📎',
  'Patio_Lawn_and_Garden': '🌿', 'Pet_Supplies': '🐾',
  'Sports_and_Outdoors': '⚽', 'Tools_and_Home_Improvement': '🔧',
  'Toys_and_Games': '🎮',
};

const CATEGORY_DESCRIPTIONS = {
  'Arts_Crafts_and_Sewing': 'Creative supplies for arts, crafts, and sewing projects',
  'Automotive': 'Car parts, accessories, and automotive tools',
  'Baby': 'Baby care products, clothing, and accessories',
  'Beauty': 'Beauty, skincare, and cosmetic products',
  'Books': 'Physical and digital books across all genres',
  'CDs_and_Vinyl': 'Music CDs, vinyl records, and audio media',
  'Cell_Phones_and_Accessories': 'Mobile phones, cases, chargers, and accessories',
  'Electronics': 'Electronic devices, components, and gadgets',
  'Grocery_and_Gourmet_Food': 'Food items, snacks, and gourmet ingredients',
  'Health_and_Personal_Care': 'Health supplements, personal care, and wellness products',
  'Home_and_Kitchen': 'Home décor, kitchen appliances, and household items',
  'Industrial_and_Scientific': 'Industrial equipment and scientific supplies',
  'Movies_and_TV': 'Movies, TV shows, and video media',
  'Office_Products': 'Office supplies, stationery, and equipment',
  'Patio_Lawn_and_Garden': 'Outdoor furniture, garden tools, and lawn care',
  'Pet_Supplies': 'Pet food, toys, and care products',
  'Sports_and_Outdoors': 'Sports equipment and outdoor recreation gear',
  'Tools_and_Home_Improvement': 'Power tools, hand tools, and home improvement supplies',
  'Toys_and_Games': 'Toys, board games, and children\'s entertainment',
};

function readCSV(filePath, limit) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (count < limit && row.title && row.title.trim().length > 2) {
          results.push({
            title: row.title.trim(),
            description: row.description ? row.description.trim() : '',
            price: row.price ? parseFloat(row.price) || 0 : Math.round(Math.random() * 100 * 100) / 100,
            imageUrl: row.imUrl || '',
            brand: row.brand || '',
            asin: row.asin || '',
            category: row.category,
          });
          count++;
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function autoSeed() {
  // Only seed if database is empty
  const count = await Product.countDocuments();
  if (count > 0) {
    console.log(`📊 Database already has ${count} products, skipping auto-seed.`);
    return;
  }

  // Check if dataset directory exists
  if (!fs.existsSync(DATASET_DIR)) {
    console.log('⚠️  Dataset directory not found, skipping auto-seed.');
    return;
  }

  console.log('\n🌱 Auto-seeding database (first run)...\n');

  // Create demo accounts
  let seller = await User.findOne({ email: 'seller@demo.com' });
  if (!seller) {
    seller = await User.create({ name: 'Demo Seller', email: 'seller@demo.com', password: 'password123', role: 'seller' });
    console.log('  👤 Created demo seller: seller@demo.com / password123');
  }
  let admin = await User.findOne({ email: 'admin@demo.com' });
  if (!admin) {
    admin = await User.create({ name: 'Admin', email: 'admin@demo.com', password: 'admin123', role: 'admin' });
    console.log('  👑 Created admin: admin@demo.com / admin123');
  }

  const csvFiles = fs.readdirSync(DATASET_DIR).filter(f => f.endsWith('.csv') && !f.startsWith('combined'));
  let totalSeeded = 0;

  for (const file of csvFiles) {
    const categoryName = file.replace('.csv', '');
    const filePath = path.join(DATASET_DIR, file);
    try {
      const products = await readCSV(filePath, LIMIT_PER_CATEGORY);
      if (products.length === 0) continue;

      const productsWithMeta = products.map(p => ({
        ...p,
        confidence: Math.round((0.5 + Math.random() * 0.5) * 10000) / 10000,
        modelUsed: 'seeded',
        sellerId: seller._id,
        altCategories: [],
      }));

      await Product.insertMany(productsWithMeta, { ordered: false });
      totalSeeded += products.length;

      await Category.findOneAndUpdate(
        { name: categoryName },
        {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          productCount: products.length,
          description: CATEGORY_DESCRIPTIONS[categoryName] || `Products in ${categoryName}`,
          icon: CATEGORY_ICONS[categoryName] || '📦',
        },
        { upsert: true, new: true }
      );
      console.log(`  📂 ${categoryName}: ${products.length} products`);
    } catch (error) {
      console.error(`  ❌ ${categoryName}: ${error.message}`);
    }
  }

  // Sync counts
  const categories = await Category.find();
  for (const cat of categories) {
    cat.productCount = await Product.countDocuments({ category: cat.name });
    await cat.save();
  }

  console.log(`\n✨ Auto-seed complete: ${totalSeeded} products, ${categories.length} categories\n`);
}

module.exports = autoSeed;
