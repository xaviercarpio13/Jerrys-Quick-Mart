const Item = require('../src/models/Item');
const LineItem = require('../src/models/LineItem');

test('LineItem subtotal computes unitPrice * quantity', () => {
    const item = new Item('Milk', 10, 4.25, 3.99, 'exempt');
    const li = new LineItem(item, 2, 4.25);
    expect(li.item.name).toBe('Milk');
    expect(li.quantity).toBe(2);
    expect(li.unitPrice).toBeCloseTo(4.25);
    expect(li.subtotal()).toBeCloseTo(8.5);
});
