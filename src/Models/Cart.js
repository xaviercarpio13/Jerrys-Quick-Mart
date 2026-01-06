const LineItem = require('./LineItem');

class Cart {
    constructor() {
        this.items = [];
        if (arguments.length >= 1 && arguments[0]) {
            const item = arguments[0];
            const quantity = arguments[1] || 1;
            const unitPrice = arguments[2] || null;
            this.addItem(item, quantity, unitPrice);
        }
    }

    // singleton
    static getInstance() {
        if (!Cart._instance) {
            Cart._instance = new Cart();
        }
        return Cart._instance;
    }

    // create the singleton Cart with initial raw item params if not already created.
    // If a Cart already exists, this will add the passed item to the existing cart.
    static createInstance(item, quantity = 1, unitPrice = null) {
        if (!Cart._instance) {
            Cart._instance = new Cart(item, quantity, unitPrice);
            return Cart._instance;
        }
        // already exists -> add to it
        Cart._instance.addItem(item, quantity, unitPrice);
        return Cart._instance;
    }

    addItem(item, quantity = 1, unitPrice = null) {
        if (!item) return false;
        // validate stock if the item carries a quantity field
        const available = typeof item.quantity === 'number' ? item.quantity : Infinity;
        if (available < quantity) return false;

        const existing = this.items.find(li => li.item.name === item.name);
        if (existing) {
            // check combined quantity against stock
            const combined = existing.quantity + Number(quantity);
            if (combined > available) return false;
            existing.quantity = combined;
            return true;
        }
        const li = new LineItem(item, quantity, unitPrice);
        this.items.push(li);
        return true;
    }

    deleteItem(itemName, quantity = null) {
        const idx = this.items.findIndex(li => li.item.name === itemName);
        if (idx === -1) return false;
        if (quantity === null) {
            this.items.splice(idx, 1);
            return true;
        }
        this.items[idx].quantity -= Number(quantity);
        if (this.items[idx].quantity <= 0) this.items.splice(idx, 1);
        return true;
    }

    calculateSubtotal() {
        return this.items.reduce((sum, li) => sum + li.subtotal(), 0);
    }

    goToCheckout(customer = null) {
        const Receipt = require('./Receipt');
        return new Receipt(this.items.slice(), customer);
    }
}

module.exports = Cart;
