const path = require('path');
const { parseProductFile } = require('../utils/IOParser');
const Item = require('./Models/Item');
const Catalog = require('./Models/Catalog');

// Build the path to data/inventory.txt
const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.txt');

// Parse products
const productData = parseProductFile(inventoryPath);

const items = productData.map(p => 
    new Item(
        p.item,
        p.quantity,
        p.regularPrice,
        p.memberPrice,
        p.taxStatus
    )
);

// Test output
console.log('=== Inventory Loaded ===');

items.forEach((item, index) => {
    console.log(
        `${index + 1}. ${item.name} | Qty: ${item.quantity} | ` +
        `Regular: $${item.regularPrice.toFixed(2)} | ` +
        `Member: $${item.memberPrice.toFixed(2)} | ` +
        `Tax: ${item.taxStatus}`
    );
});

const catalog = new Catalog(items);

catalog.printCatalog();
