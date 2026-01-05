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


    printCatalog(customer) {
        console.log(`=== Catalog for ${customer.name} ===`);

        this.items.forEach((item, index) => {
            let price;

            if (customer instanceof RewardsMember) {
                price = item.memberPrice;
            } else if (customer instanceof RegularCustomer) {
                price = item.regularPrice;
            }

            console.log(
                `${index + 1}. ${item.name} | Stock: ${item.quantity} | ` +
                `Price: $${price.toFixed(2)}`
            );
        });
    }
}

module.exports = Catalog;

