const Item = require('../src/Models/Item');
const Cart = require('../src/Models/Cart');

beforeEach(() => {
    // reset singleton
    Cart._instance = undefined;
});

test('Cart singleton creation and addItem subtotal', () => {
    const item = new Item('Milk', 10, 4.25, 3.99, 'exempt');
    const cart = Cart.createInstance(item, 2, 4.25);

    expect(cart).toBeDefined();
    expect(cart.items.length).toBe(1);
    expect(cart.calculateSubtotal()).toBeCloseTo(8.5);

    // add another item
    const item2 = new Item('Shampoo', 5, 6.5, 5.75, 'taxable');
    cart.addItem(item2, 1, 6.5);
    expect(cart.items.length).toBe(2);
    expect(cart.calculateSubtotal()).toBeCloseTo(15.0);
});
