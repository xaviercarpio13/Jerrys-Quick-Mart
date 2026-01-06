const RegularCustomer = require('./RegularCustomer');
const RewardsMember = require('./RewardsCustomer');

class Catalog {
    constructor(items = []) {
        this.items = items;
    }

    updateCatalog(newItems) {
        if (!Array.isArray(newItems)) return false;
        this.items = newItems;
        return true;
    }

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
