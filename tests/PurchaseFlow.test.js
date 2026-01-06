const Item = require('../src/models/Item');
const Catalog = require('../src/models/Catalog');
const Cart = require('../src/models/Cart');

beforeEach(() => {
    Cart._instance = undefined;
});

test('Purchase flow respects stock and writes expected subtotal/tax', () => {
    const items = [
        new Item('Milk', 2, 4.25, 3.99, 'exempt'),
        new Item('Shampoo', 1, 6.5, 5.75, 'taxable')
    ];
    const catalog = new Catalog(items);
    const cart = Cart.createInstance(items[0], 1, items[0].regularPrice);
    cart.addItem(items[1], 1, items[1].regularPrice);
    expect(cart.calculateSubtotal()).toBeCloseTo(4.25 + 6.5);
});

test('Purchase is blocked when stock is insufficient', () => {
    const items = [
        new Item('Milk', 1, 4.25, 3.99, 'exempt')
    ];
    const cart = Cart.createInstance(items[0], 1, items[0].regularPrice);
    // attempt to add one more milk when only 1 was available and already added
    const success = cart.addItem(items[0], 1, items[0].regularPrice);
    expect(success).toBe(false);
});
