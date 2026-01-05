const Customer = require('./Customer');

class RegularCustomer extends Customer {
    constructor(name, joiningDate) {
        super(name);
        this.joiningDate = joiningDate;
    }
}

module.exports = RegularCustomer;