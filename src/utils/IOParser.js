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

/**
 * Rewrites a text file after a purchase.
 * @param {string} filePath - The path to the text file.
 * @param {Array} products - The updated array of product objects.
 */
function updateTxtFile(filePath, products) {
    try {
        const lines = products.map(item => {
            const name = item.name;
            const qty = typeof item.quantity !== 'undefined' ? item.quantity : (item.quantityStock || 0);
            const regular = typeof item.regularPrice === 'number' ? item.regularPrice.toFixed(2) : item.regularPrice;
            const member = typeof item.memberPrice === 'number' ? item.memberPrice.toFixed(2) : item.memberPrice;
            const tax = (typeof item.taxStatus === 'string') ? item.taxStatus : String(item.taxStatus);
            return `${name}: ${qty}, ${regular}, ${member}, ${tax}`;
        });
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        return true;
    } catch (error) {
        console.error("Error updating inventory file:", error);
        return false;
    }
}

module.exports = { parseProductFile, updateTxtFile };

