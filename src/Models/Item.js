class Item {
    constructor(name, quantity, regularPrice, memberPrice, taxStatus) {
        this.name = name;
        this.quantity = quantity;
        this.regularPrice = regularPrice;
        this.memberPrice = memberPrice;
        this.taxStatus = taxStatus;
    }
}

module.exports = Item;
