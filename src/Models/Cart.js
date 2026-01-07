const LineItem = require('./LineItem');
const Receipt = require('./Receipt');

/**
 * Shopping cart storing LineItem instances. Provides add/remove and checkout helpers.
 * @class Cart
 */
class Cart {
    constructor() {
        this.items = [];
        if (arguments.length >= 1 && arguments[0]) {
            const item = arguments[0];
            const quantity = arguments[1] || 1;
            const unitPrice = arguments[2] || null;
            const regularPrice = arguments[3] || null;
            this.addItem(item, quantity, unitPrice, regularPrice);
        }
    }

    /**
     * Get the singleton Cart instance for the current process.
     * @returns {Cart}
     */
    static getInstance() {
        if (!Cart._instance) {
            Cart._instance = new Cart();
        }
        return Cart._instance;
    }

    /**
     * Create the singleton cart and optionally add an initial item.
     * If a cart already exists, the provided item is added to it.
     * @param {Item} item
     * @param {number} [quantity]
     * @param {number|null} [unitPrice]
     * @returns {Cart}
     */
    static createInstance(item, quantity = 1, unitPrice = null) {
        if (!Cart._instance) {
            Cart._instance = new Cart(item, quantity, unitPrice);
            return Cart._instance;
        }
        Cart._instance.addItem(item, quantity, unitPrice);
        return Cart._instance;
    }

    /**
     * Add an item to the cart or increment quantity when already present.
     * Validates available stock using the passed item's `quantity` property.
     * @param {Item} item
     * @param {number} [quantity=1]
     * @param {number|null} [unitPrice=null]
     * @param {number|null} [regularPrice=null]
     * @returns {boolean} true when added or updated, false if rejected (e.g., insufficient stock)
     */
    addItem(item, quantity = 1, unitPrice = null, regularPrice = null) {
        if (!item) return false;
        const available = typeof item.quantity === 'number' ? item.quantity : Infinity;
        if (available < quantity) return false;
        const existing = this.items.find(li => li.item.name === item.name);
        if (existing) {
            const combined = existing.quantity + Number(quantity);
            if (combined > available) return false;
            existing.quantity = combined;
            return true;
        }
        const li = new LineItem(item, quantity, unitPrice, regularPrice);
        this.items.push(li);
        return true;
    }

    /**
     * Remove an item from the cart. If quantity is provided, subtracts that quantity;
     * if omitted the entire line is removed.
     * @param {string} itemName
     * @param {number|null} [quantity=null]
     * @returns {boolean} true on success, false if item not found.
     */
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

    /**
     * Compute the cart subtotal (sum of line subtotals, pre-tax).
     * @returns {number}
     */
    calculateSubtotal() {
        return this.items.reduce((sum, li) => sum + li.getSubtotal(), 0);
    }

    /**
     * Build a Receipt for the current cart. When `cash` is omitted returns a preview
     * Receipt (no side effects). When `cash` is provided, validates the cash against
     * the receipt total and clears the cart on success, returning the final Receipt.
     * @param {number|null} [cash]
     * @returns {Receipt|null}
     */
    goToCheckout(cash) {
        // If no cash provided, return a receipt preview (no side-effects)
        if (cash === undefined || cash === null) {
            return new Receipt(this.items.slice(), cash);
        }
        const cashNum = Number(cash);
        const receipt = new Receipt(this.items.slice(), cashNum);
        const total = receipt.calculateTotal();
        if (cashNum >= total) {
            this.items = []; // clear cart
            return receipt;
        }
        return null;
    }
}

module.exports = Cart;
