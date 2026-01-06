const Item = require('./Item');

class LineItem {
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
    subtotal() {
        return Number((this.unitPrice * this.quantity) || 0);
    }
}

module.exports = LineItem;

