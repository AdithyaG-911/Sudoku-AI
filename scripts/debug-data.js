
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../data/real-data.json');

console.log("Loading real dataset from", jsonPath);
if (!fs.existsSync(jsonPath)) {
    console.error("File not found!");
    process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const count = raw.labels.length;
console.log(`Loaded ${count} examples.`);

console.log("Checking labels...");
const labels = raw.labels;
const counts = {};
let minLabel = 1000;
let maxLabel = -1000;

for (let i = 0; i < count; i++) {
    const l = labels[i];
    if (typeof l !== 'number' || isNaN(l)) {
        console.error(`Invalid label at index ${i}:`, l);
    }
    if (!counts[l]) counts[l] = 0;
    counts[l]++;
    if (l < minLabel) minLabel = l;
    if (l > maxLabel) maxLabel = l;
}
console.log("Label distribution:", counts);
console.log(`Label Range: ${minLabel} to ${maxLabel}`);

if (maxLabel > 10 || minLabel < 0) {
    console.error("ERROR: Labels must be 0-10");
}

console.log("Checking images...");
const images = raw.images;
let totalNaN = 0;
let totalInf = 0;
let totalOutOfRange = 0;

for (let i = 0; i < count; i++) {
    const img = images[i];
    if (img.length !== 784) {
        console.error(`Image ${i} has wrong length: ${img.length}`);
    }

    for (let j = 0; j < img.length; j++) {
        const val = img[j];
        if (Number.isNaN(val)) {
            totalNaN++;
        } else if (!Number.isFinite(val)) {
            totalInf++;
        } else if (val < 0 || val > 1) {
            // slightly out of range due to float precision is ok, but wild values are bad
            if (val < -0.001 || val > 1.001) totalOutOfRange++;
        }
    }
}

console.log("Image Check Results:");
console.log(`Total NaNs: ${totalNaN}`);
console.log(`Total Infinity: ${totalInf}`);
console.log(`Total Out of Range (<0 or >1): ${totalOutOfRange}`);

if (totalNaN > 0 || totalInf > 0) {
    console.error("DATASET CORRUPTED: Contains NaNs or Infinity.");
} else {
    console.log("Dataset looks numerically valid.");
}
