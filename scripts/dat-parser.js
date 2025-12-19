const fs = require('fs');

/**
 * Parse .dat file to extract 9x9 grid
 * @param {string} datPath 
 * @returns {number[][]} 9x9 grid
 */
function parseDatFile(datPath) {
    const content = fs.readFileSync(datPath, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Lines 3-11 contain the 9x9 grid (skip metadata lines 1-2)
    const grid = [];
    for (let i = 2; i < 11; i++) {
        if (i >= lines.length) break;
        const row = lines[i].split(/\s+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
        if (row.length === 9) {
            grid.push(row);
        }
    }

    if (grid.length !== 9) {
        throw new Error(`Invalid grid in ${datPath}: expected 9 rows, got ${grid.length}`);
    }

    return grid;
}

module.exports = { parseDatFile };
