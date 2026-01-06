const path = require('path');
const { parseProductFile } = require('../utils/IOParser');
const Item = require('./Models/Item');
const Catalog = require('./Models/Catalog');
const RegularCustomer = require('./Models/RegularCustomer');
const RewardsMember = require('./Models/RewardsCustomer');
const Cart = require('./Models/Cart');
const LineItem = require('./Models/LineItem');


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

const customer = new RegularCustomer('Alice', new Date());
const catalog = new Catalog(items);

let customerCatalog = catalog.getCatalogForCustomer(customer);


console.log(`=== Catalog for ${customer.name} ===`);
customerCatalog.forEach((item, index) => {
    console.log(
        `${index + 1}. ${item.name} | Stock: ${item.quantity} | ` +
        `Price: $${item.price.toFixed(2)}`
    );
});

// ========== SIMULATION OF PURCHASE ===============


// ========== SIMULATION OF PURCHASES ===============
// Workflow: create Cart with first raw item; subsequent purchases reuse singleton Cart
// Create cart (singleton) with first item
const cart = Cart.getInstance(); //

purchase(0, 1); // Milk
purchase(5, 1); // Shampoo
purchase(6, 2); // Deodorant


const cartInstance = Cart.getInstance();
console.log('\n=== Cart Summary ===');
console.log(`Subtotal (no tax): $${cartInstance.calculateSubtotal().toFixed(2)}`);


const receipt = cartInstance.goToCheckout();
console.log('\n' + receipt.generateReceipt());


function purchase(itemIndex, qty) {
    const product = catalog.items[itemIndex];
    cart.addItem(product, qty, product.regularPrice); 
}
