const path = require('path');
const { parseProductFile, updateTxtFile, printIntoTxt } = require('./utils/IOParser');
const Item = require('./models/Item');
const Catalog = require('./models/Catalog');
const RegularCustomer = require('./models/RegularCustomer');
const RewardsMember = require('./models/RewardsCustomer');
const Cart = require('./models/Cart');


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


// ========== SIMULATION OF PURCHASES ===============

console.log('\n========================');
const cartInstance = Cart.getInstance();
purchase(0, 1); // Milk
purchase(5, 1); // Shampoo
purchase(6, 2); // Deodorant
const receipt = cartInstance.goToCheckout(20);
console.log('\n========================');
if(receipt==null){
    console.log("Insufficient cash provided. Transaction cancelled!");
    return
} 
console.log('\n' + receipt.generateReceipt());

// Save the receipt to receipts/ using printIntoTxt
try {
    const savedFile = printIntoTxt(receipt.generateReceipt(), receipt.transId, receipt.date);
    if (savedFile) console.log(`Receipt written to receipts/${savedFile}`);
} catch (err) {
    console.error('Failed to save receipt via ShoppingMain:', err && err.message);
}

updateAndReloadStock(cartInstance.items, items);

function purchase(itemIndex, qty) {
    const product = catalog.items[itemIndex];
    let success = false;
    if (!product) {
        console.log(`Purchase failed: invalid product index ${itemIndex}`);
        return false;
    }
    // Delegate stock validation to Cart.addItem (single source of truth)
    if (customer instanceof RewardsMember ){
        success = cartInstance.addItem(product, qty, product.memberPrice,product.regularPrice);
    }

    if (customer instanceof RegularCustomer){
        success = cartInstance.addItem(product, qty, product.regularPrice);
    }
    
    if (success) {
        // reserve stock in master catalog
        const available = typeof product.quantity === 'number' ? product.quantity : 0;
        product.quantity = Math.max(0, available - qty);
        console.log(`Added ${qty} x ${product.name} to cart. Remaining stock: ${product.quantity}`);
        return true;
    }
    console.log(`Purchase blocked: insufficient stock for ${product.name} (requested ${qty})`);
    return false;
}


/**
 * @param {Array} cartItems
 * @param {Array} masterItems
 */
function updateAndReloadStock(cartItems, masterItems) {
    cartItems.forEach(lineItem => {
        const originalItem = masterItems.find(item => item.name === lineItem.item.name);
        if (originalItem) {
            console.log(`Inventory Sync: ${originalItem.name} stock is now ${originalItem.quantity}`);
        }
    });
    const success = updateTxtFile(inventoryPath, masterItems);

    if (success) {
        console.log("File system updated successfully.");
    }
}