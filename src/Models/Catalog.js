const RegularCustomer = require('./RegularCustomer');
const RewardsMember = require('./RewardsCustomer');

/**
 * Catalog holds available items and exposes a customer-specific view.
 * @class Catalog
 */
class Catalog {
    /**
     * @param {Item[]} items - Array of Item instances representing inventory.
     */
    constructor(items = []) {
        this.items = items;
    }

    /**
     * Replace the catalog items with a new array.
     * @param {Item[]} newItems
     * @returns {boolean} true on success, false if input invalid.
     */
    updateCatalog(newItems) {
        if (!Array.isArray(newItems)) return false;
        this.items = newItems;
        return true;
    }

    /**
     * Produce a customer-specific catalog view where each entry contains
     * name, available quantity, price (regular/member), and taxStatus.
     * @param {RegularCustomer|RewardsMember} customer
     * @returns {Array<{name:string,quantity:number,price:number,taxStatus:string}>}
     */
    getCatalogForCustomer(customer) {
        if (!customer) {
            throw new Error('Customer must be provided');
        }

        return this.items.map(item => {
            let price;

            if (customer instanceof RewardsMember) {
                price = item.memberPrice;
            } else if (customer instanceof RegularCustomer) {
                price = item.regularPrice;
            } else {
                throw new Error('Unknown customer type');
            }

            return {
                name: item.name,
                quantity: item.quantity,
                price: price,
                taxStatus: item.taxStatus
            };
        });
    }
}

module.exports = Catalog;
