class Receipt {
    constructor(lineItems = [], customer = null, taxRate = 0.065) {
        this.lineItems = lineItems.map(li => ({
            name: li.item.name,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: Number((li.unitPrice * li.quantity) || 0),
            taxStatus: li.item.taxStatus
        }));
        this.customer = customer;
        this.taxRate = taxRate; // 6.5% per requirement
        this.date = new Date();
        this.transId = `T-${Math.floor(Math.random() * 1000000)}`;
    }

    calculateSubtotal() {
        return this.lineItems.reduce((s, it) => s + it.subtotal, 0);
    }

    calculateTax() {
        let TAX = 0;
        this.lineItems.forEach(it => {
            const taxStatus = it.taxStatus;
            const taxable = (typeof taxStatus === 'string') ? taxStatus.toLowerCase().includes('taxable') : Boolean(taxStatus);
            if (taxable) {
                TAX += it.subtotal * this.taxRate;
            }
        });
        return TAX;
    }

    calculateTotal() {
        const subtotal = this.calculateSubtotal();
        const TAX = this.calculateTax();
        return subtotal + TAX;
    }

    generateReceipt() {
        const lines = [];
        lines.push(`Receipt: ${this.transId}`);
        lines.push(`Date: ${this.date.toISOString()}`);
        if (this.customer && this.customer.name) lines.push(`Customer: ${this.customer.name}`);
        lines.push('---');
        this.lineItems.forEach(it => {
            lines.push(`${it.name} x${it.quantity} @ $${it.unitPrice.toFixed(2)} = $${it.subtotal.toFixed(2)}`);
        });
        lines.push('---');
        const subtotal = this.calculateSubtotal();
        const TAX = this.calculateTax();
        lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
        lines.push(`Tax: $${TAX.toFixed(2)}`);
        lines.push(`Total: $${(subtotal + TAX).toFixed(2)}`);
        return lines.join('\n');
    }
}

module.exports = Receipt;
