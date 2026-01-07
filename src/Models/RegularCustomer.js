const Customer = require('./Customer');

/**
 * Regular (non-rewards) customer.
 * @extends Customer
 */
class RegularCustomer extends Customer {
    /**
     * @param {string} name
     * @param {Date} joiningDate
     */
    constructor(name, joiningDate) {
        super(name);
        this.joiningDate = joiningDate;
    }
}

module.exports = RegularCustomer;