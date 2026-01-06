class Receipt {
    constructor(lineItems = [], cash = 0) {
        this.lineItems = lineItems.map(li => ({
            name: li.item.name,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            subtotal: Number((li.unitPrice * li.quantity) || 0),
            taxStatus: li.item.taxStatus,
            regularPrice: li.regularPrice || null
        }));
        this.taxRate = 0.065; // 6.5% per requirement
        this.date = new Date();
        this.transId = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        this.cash = cash;
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
        lines.push(`Date: ${this.date.toISOString()}`);
        lines.push(`Transaction: ${this.transId}`);
        lines.push('---');
        lines.push(
            'ITEM'.padEnd(20) +
            'QUANTITY'.padEnd(12) +
            'UNIT PRICE'.padEnd(14) +
            'TOTAL'
        );


        // Format each line item
        this.lineItems.forEach(it => {
            const total = it.subtotal.toFixed(2);
            const unit = it.unitPrice.toFixed(2);

            lines.push(
                it.name.padEnd(20) +
                String(it.quantity).padEnd(12) +
                `$${unit}`.padEnd(14) +
                `$${total}`
            );
        });
        lines.push('---');
        const totalItemsSold = this.lineItems.reduce((sum, it) => sum + it.quantity, 0);
        const subtotal = this.calculateSubtotal();
        const TAX = this.calculateTax();
        const total = this.calculateTotal();
        lines.push(`Total of items sold: ${totalItemsSold}`);
        lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
        lines.push(`Tax (6.5%): $${TAX.toFixed(2)}`);
        lines.push(`Total: $${total.toFixed(2)}`);
        lines.push(`Cash: $${this.cash.toFixed(2)}`);
        lines.push(`Change: $${(this.cash - total).toFixed(2)}`);
        let totalSaved = 0;
        this.lineItems.forEach(it => {
            if (it.regularPrice === null) {
                totalSaved = 0;
            } else{
                totalSaved += (it.regularPrice - it.unitPrice) * it.quantity;
            }
        });
        lines.push(`You saved: $${totalSaved.toFixed(2)}`);

        return lines.join('\n');
    }
}

module.exports = Receipt;
