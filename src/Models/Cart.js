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

    addItem(item, quantity = 1, unitPrice = null) {
        if (!item) return false;
        const existing = this.items.find(li => li.item.name === item.name);
        if (existing) {
            existing.quantity += Number(quantity);
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

    // subtotal without tax
    calculateSubtotal() {
        return this.items.reduce((sum, li) => sum + li.subtotal(), 0);
    }

    // create a light receipt object; actual tax calculation happens in Receipt
    goToCheckout(customer = null) {
        const Receipt = require('./Receipt');
        return new Receipt(this.items.slice(), customer);
    }
}

module.exports = Cart;
