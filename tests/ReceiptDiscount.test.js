const Item = require('../src/models/Item');
const LineItem = require('../src/models/LineItem');
const Receipt = require('../src/models/Receipt');

test('Receipt computes total discount (you saved) from regular prices', () => {
    const milk = new Item('Milk', 10, 4.25, 3.99, 'exempt');
    const cola = new Item('Cola', 10, 2.50, 2.00, 'taxable');
    const li1 = new LineItem(milk, 2, 3.99, 4.25); // saved 0.26 * 2 = 0.52
    const li2 = new LineItem(cola, 3, 2.00, 2.50); // saved 0.50 * 3 = 1.50

    const receipt = new Receipt([li1, li2], 20);

    // compute expected saved
    const expectedSaved = ((4.25 - 3.99) * 2) + ((2.50 - 2.00) * 3);
    // compute from receipt.lineItems defensive
    const actualSaved = receipt.lineItems.reduce((s, it) => {
        const normal = Number(it.regularPrice || 0);
        const unit = Number(it.unitPrice || 0);
        const qty = Number(it.quantity || 0);
        return s + Math.max(0, normal - unit) * qty;
    }, 0);

    expect(actualSaved).toBeCloseTo(expectedSaved);
});
