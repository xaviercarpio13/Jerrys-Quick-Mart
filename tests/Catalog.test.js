
const Catalog = require('../src/Models/Catalog');
const Item = require('../src/Models/Item');

test('Catalog stores items on construction', () => {
    const items = [
        new Item('Milk',1, 3.75, 3.50, true),
        new Item('Bread',2, 2.80, 2.50, false)
    ];

    const catalog = new Catalog(items);

    expect(catalog.items.length).toBe(2);
    expect(catalog.items[0].name).toBe('Milk');
});

test('updateCatalog replaces item list', () => {
    const catalog = new Catalog([]);

    const newItems = [
        new Item('Eggs',1, 4.20, 3.90, false)
    ];

    const result = catalog.updateCatalog(newItems);

    expect(result).toBe(true);
    expect(catalog.items.length).toBe(1);
    expect(catalog.items[0].name).toBe('Eggs');
});
