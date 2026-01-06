const Item = require('../src/models/Item');
const Cart = require('../src/models/Cart');
const Receipt = require('../src/models/Receipt');

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

test('goToCheckout should fail when cash is insufficient and keep cart intact', () => {
    const item = new Item('Soda', 5, 3.00, 2.50, 'taxable');
    const cart = Cart.createInstance(item, 1, 3.00);
    // total with tax = 3.00 + 3.00*0.065 = 3.195
    const receipt = cart.goToCheckout(3.00); // insufficient cash
    expect(receipt).toBeNull();
    // cart should remain unchanged
    expect(cart.items.length).toBe(1);
    expect(cart.calculateSubtotal()).toBeCloseTo(3.00);
});

test('goToCheckout should succeed when cash is sufficient and clear the cart', () => {
    const item = new Item('Soda', 5, 3.00, 2.50, 'taxable');
    const cart = Cart.createInstance(item, 2, 3.00);
    // subtotal = 6.00, tax = 6.00*0.065 = 0.39, total = 6.39
    const receipt = cart.goToCheckout(7.00); // sufficient cash
    expect(receipt).toBeInstanceOf(Receipt);
    // cart should be cleared after successful checkout
    expect(cart.items.length).toBe(0);
});
