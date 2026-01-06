// tests/IOParser.test.js

const fs = require('fs');
const path = require('path');
const { parseProductFile } = require('../src/utils/IOParser');

test('IOParser parses inventory file correctly', () => {
    const testFilePath = path.join(__dirname, 'test_inventory.txt');

    const content = `
Milk: 5, 3.75, 3.50, Tax-Exempt
Red Bull: 10, 4.30, 4.00, Taxable
`;

    fs.writeFileSync(testFilePath, content);

    const products = parseProductFile(testFilePath);

    expect(products.length).toBe(2);
    expect(products[0].item).toBe('Milk');
    expect(products[0].regularPrice).toBe(3.75);
    expect(products[0].memberPrice).toBe(3.50);
    expect(products[0].taxStatus).toBe('tax-exempt');

    fs.unlinkSync(testFilePath);
});


