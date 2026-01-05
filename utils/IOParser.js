const fs = require('fs');
const path = require('path');

/**
 * Reads a text file and parses product information.
 * @param {string} filePath - The path to the text file.
 * @returns {Array} - An array of product objects.
 */
function parseProductFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const lines = data.split('\n').filter(line => line.trim() !== '');

        const products = lines.map(line => {
            const [item, details] = line.split(':');
            const [quantity, regularPrice, memberPrice, taxStatus] = details.split(',').map(part => part.trim());

            return {
                item: item.trim(),
                quantity: parseInt(quantity, 10),
                regularPrice: parseFloat(regularPrice),
                memberPrice: parseFloat(memberPrice),
                taxStatus: taxStatus.toLowerCase()
            };
        });

        return products;
    } catch (error) {
        console.error('Error reading or parsing the file:', error.message);
        return [];
    }
}
module.exports = { parseProductFile };

