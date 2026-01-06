const Item = require('../src/models/Item');
const LineItem = require('../src/models/LineItem');
const Receipt = require('../src/models/Receipt');

test('Receipt computes tax only for taxable items and totals', () => {
    const milk = new Item('Milk', 10, 4.25, 3.99, 'exempt');
    const shampoo = new Item('Shampoo', 5, 6.5, 5.75, 'taxable');

    const li1 = new LineItem(milk, 1, 4.25);
    const li2 = new LineItem(shampoo, 2, 6.5);

    const receipt = new Receipt([li1, li2], null, 0.065);

    expect(receipt.calculateSubtotal()).toBeCloseTo(17.25);
    // tax only on shampoo: 13.00 * 0.065 = 0.845 -> 0.845
    expect(receipt.calculateTax()).toBeCloseTo(13 * 0.065);
    expect(receipt.calculateTotal()).toBeCloseTo(17.25 + (13 * 0.065));
});
