const Item = require('../src/models/Item');
const Catalog = require('../src/models/Catalog');
const Cart = require('../src/models/Cart');

beforeEach(() => {
    Cart._instance = undefined;
});

test('Integration: simulate shopping flow and successful checkout', () => {
    const items = [
        new Item('Milk', 5, 4.25, 3.99, 'exempt'),
        new Item('Shampoo', 3, 6.50, 5.75, 'taxable'),
        new Item('Chips', 10, 1.50, 1.25, 'taxable')
    ];

    const catalog = new Catalog(items);
    const cart = Cart.createInstance(items[0], 2, items[0].regularPrice);
    cart.addItem(items[1], 1, items[1].regularPrice);
    cart.addItem(items[2], 4, items[2].regularPrice);

    const subtotal = cart.calculateSubtotal();
    expect(subtotal).toBeCloseTo(2 * 4.25 + 6.50 + 4 * 1.50);

    // compute totals using Receipt via checkout with cash
    const cashProvided = 100;
    const receipt = cart.goToCheckout(cashProvided);
    expect(receipt).not.toBeNull();
    // cart should be cleared
    expect(cart.items.length).toBe(0);

    const total = receipt.calculateTotal();
    expect(cashProvided).toBeGreaterThan(total);
});
