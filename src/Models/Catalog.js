class Catalog {
    constructor(items = []) {
        this.items = items; // List<Item>
    }

    updateCatalog(newItems) {
        if (!Array.isArray(newItems)) return false;
        this.items = newItems;
        return true;
    }

    printCatalog() {
        console.log('=== Catalog ===');

        this.items.forEach((item, index) => {
            console.log(
                `${index + 1}. ${item.name} | Qty: ${item.quantity} | ` +
                `Regular: $${item.regularPrice.toFixed(2)} | ` +
                `Rewards: $${item.memberPrice.toFixed(2)} | ` +
                `Taxable: ${item.taxStatus}`
            );
        });

        console.log(`\nTotal catalog items: ${this.items.length}`);
    }
}

module.exports = Catalog;