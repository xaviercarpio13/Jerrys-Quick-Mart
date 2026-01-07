const Customer = require('./Customer');

/**
 * Rewards member customer type (eligible for member prices).
 * @extends Customer
 */
class RewardsMember extends Customer {
    /**
     * @param {string} name
     * @param {Date} renewalDate
     */
    constructor(name, renewalDate) {
        super(name);
        this.renewalDate = renewalDate;
    }
}

module.exports = RewardsMember;
