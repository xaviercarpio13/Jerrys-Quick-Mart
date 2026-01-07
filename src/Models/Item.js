/**
 * Represents a product in the catalog and inventory.
 * @class Item
 */
class Item {
    /**
     * @param {string} name - Product name.
     * @param {number} quantity - Available stock quantity.
     * @param {number} regularPrice - Default price for regular customers.
     * @param {number} memberPrice - Discounted price for rewards customers.
     * @param {string} taxStatus - String describing taxability (e.g. 'taxable' or 'exempt').
     */
    constructor(name, quantity, regularPrice, memberPrice, taxStatus) {
        this.name = name;
        this.quantity = quantity;
        this.regularPrice = regularPrice;
        this.memberPrice = memberPrice;
        this.taxStatus = taxStatus;
    }
}

module.exports = Item;
