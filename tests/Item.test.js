// tests/Item.test.js

const Item = require('../src/models/Item');

test('Item stores constructor values correctly', () => {
    const item = new Item(
        'Milk',
        1,
        3.75,
        3.50,
        'taxable',
    );

    expect(item.quantity).toBe(1);
    expect(item.name).toBe('Milk');
    expect(item.regularPrice).toBe(3.75);
    expect(item.memberPrice).toBe(3.50);
    expect(item.taxStatus).toBe('taxable');
});
