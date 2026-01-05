const path = require('path');
const { parseProductFile } = require('../utils/IOParser');
const Item = require('../src/Models/Item');
const Catalog = require('../src/Models/Catalog');

test('inventory file is parsed into a catalog correctly', () => {
    const filePath = path.join(__dirname, '..', 'data', 'inventory.txt');

    const rawProducts = parseProductFile(filePath);

    const items = rawProducts.map(p =>
        new Item(
            p.item,
            p.quantity,
            p.regularPrice,
            p.memberPrice,
            p.taxStatus === 'taxable'
        )
    );

    const catalog = new Catalog(items);

    expect(catalog.items.length).toBeGreaterThan(0);
    expect(catalog.items[0].name).toBeDefined();
    expect(typeof catalog.items[0].regularPrice).toBe('number');
});
