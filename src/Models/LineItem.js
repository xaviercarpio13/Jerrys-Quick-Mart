const Item = require('./Item');

/**
 * Represents one line in the shopping cart or a receipt.
 * @class LineItem
 */
class LineItem {
    /**
     * Create a LineItem
     * @param {Item|Object} item - The Item instance or plain object describing the product.
     * @param {number} [quantity=1] - The number of units for this line.
     * @param {number|null} [unitPrice=null] - The unit price charged (may be member price).
     * @param {number|null} [regularPrice=null] - The regular (non-member) price used for savings calculation.
     */
    constructor(item, quantity = 1, unitPrice = null, regularPrice = null) {
        this.item = item instanceof Item ? item : item;
        this.quantity = Number(quantity) || 0;
        this.unitPrice = (unitPrice !== null && !Number.isNaN(Number(unitPrice)))
            ? Number(unitPrice)
            : (this.item && (this.item.regularPrice || this.item.memberPrice) ? Number(this.item.regularPrice || this.item.memberPrice) : 0);
        this.regularPrice = (regularPrice !== null && !Number.isNaN(Number(regularPrice)))
            ? Number(regularPrice)
            : null;
    }
    /**
     * Compute the subtotal for this line (unitPrice * quantity).
     * @returns {number} The subtotal amount in the same currency units as the prices.
     */
    getSubtotal() {
        return Number((this.unitPrice * this.quantity) || 0);
    }
}

module.exports = LineItem;

