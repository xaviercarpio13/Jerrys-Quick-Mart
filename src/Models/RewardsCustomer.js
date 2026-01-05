const Customer = require('./Customer');

class RewardsMember extends Customer {
    constructor(name, renewalDate) {
        super(name);
        this.renewalDate = renewalDate;
    }
}

module.exports = RewardsMember;
