/**
 * Seed Script - Populates MongoDB with products from the dataset CSVs
 * 
 * Usage: node seed.js [--limit=100] [--clear]
 * 
 * Options:
 *   --limit=N    Number of products per category (default: 100)
 *   --clear      Clear existing products before seeding
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');

const DATASET_DIR = path.join(__dirname, '..', 'dataset', 'dataset');

// Category icons mapping (no emojis, using initials on frontend)
const CATEGORY_ICONS = {
  'Arts_Crafts_and_Sewing': 'A',
  'Automotive': 'A',
  'Baby': 'B',
  'Beauty': 'B',
  'Books': 'B',
  'CDs_and_Vinyl': 'C',
  'Cell_Phones_and_Accessories': 'C',
  'Electronics': 'E',
  'Grocery_and_Gourmet_Food': 'G',
  'Health_and_Personal_Care': 'H',
  'Home_and_Kitchen': 'H',
  'Industrial_and_Scientific': 'I',
  'Movies_and_TV': 'M',
  'Office_Products': 'O',
  'Patio_Lawn_and_Garden': 'P',
  'Pet_Supplies': 'P',
  'Sports_and_Outdoors': 'S',
  'Tools_and_Home_Improvement': 'T',
  'Toys_and_Games': 'T',
};

// Category descriptions
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

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { limit: 100, clear: false };
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]) || 100;
    }
    if (arg === '--clear') {
      options.clear = true;
    }
  }
  return options;
}

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

async function seed() {
  const options = parseArgs();
  console.log(`\n[Seed] Seeding database with ${options.limit} products per category...\n`);

  await connectDB();

  if (options.clear) {
    console.log('[Seed] Clearing existing data...');
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('   Done.\n');
  }

  // Create a default seller account
  let seller = await User.findOne({ email: 'seller@demo.com' });
  if (!seller) {
    seller = await User.create({
      name: 'Demo Seller',
      email: 'seller@demo.com',
      password: 'password123',
      role: 'seller',
    });
    console.log('[Seed] Created demo seller: seller@demo.com / password123');
  }

  // Create admin account
  let admin = await User.findOne({ email: 'admin@demo.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('[Seed] Created admin: admin@demo.com / admin123\n');
  }

  // Read CSV files from dataset directory
  const csvFiles = fs.readdirSync(DATASET_DIR)
    .filter(f => f.endsWith('.csv') && !f.startsWith('combined'));

  let totalSeeded = 0;

  for (const file of csvFiles) {
    const categoryName = file.replace('.csv', '');
    const filePath = path.join(DATASET_DIR, file);
    
    console.log(`[Seed] Processing ${categoryName}...`);
    
    try {
      const products = await readCSV(filePath, options.limit);
      
      if (products.length === 0) {
        console.log(`   [WARN] No valid products found, skipping.`);
        continue;
      }

      // Add metadata to products
      const productsWithMeta = products.map(p => ({
        ...p,
        confidence: Math.round((0.5 + Math.random() * 0.5) * 10000) / 10000,
        modelUsed: 'seeded',
        sellerId: seller._id,
        altCategories: [],
      }));

      // Bulk insert
      await Product.insertMany(productsWithMeta, { ordered: false });
      totalSeeded += products.length;
      
      // Create/update category
      await Category.findOneAndUpdate(
        { name: categoryName },
        {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          productCount: products.length,
          description: CATEGORY_DESCRIPTIONS[categoryName] || `Products in ${categoryName}`,
          icon: CATEGORY_ICONS[categoryName] || '',
        },
        { upsert: true, new: true }
      );
      
      console.log(`   [OK] Seeded ${products.length} products`);
    } catch (error) {
      console.error(`   [ERR] Error: ${error.message}`);
    }
  }

  // Sync category counts with actual DB counts
  console.log('\n[Seed] Syncing category counts...');
  const categories = await Category.find();
  for (const cat of categories) {
    const count = await Product.countDocuments({ category: cat.name });
    cat.productCount = count;
    await cat.save();
  }

  console.log(`\n[Seed] Complete! Total products: ${totalSeeded}`);
  console.log(`   Categories: ${categories.length}`);
  console.log('\n[Seed] Demo accounts:');
  console.log('   Seller: seller@demo.com / password123');
  console.log('   Admin:  admin@demo.com / admin123\n');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
