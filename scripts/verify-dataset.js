const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/real-data.json');

function verify() {
    console.log(`Verifying ${DATA_FILE}...`);
    if (!fs.existsSync(DATA_FILE)) {
        console.error("File not found!");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE));

    if (!data.images || !data.labels) {
        console.error("Missing images or labels keys.");
        process.exit(1);
    }

    const count = data.labels.length;
    console.log(`Total samples: ${count}`);

    if (data.images.length !== count) {
        console.error(`Mismatch: ${data.images.length} images vs ${count} labels.`);
    }

    // Check label distribution
    const counts = {};
    let min = Infinity, max = -Infinity;

    for (const l of data.labels) {
        if (typeof l !== 'number' || isNaN(l)) {
            console.error("Found non-number label:", l);
        }
        counts[l] = (counts[l] || 0) + 1;
        if (l < min) min = l;
        if (l > max) max = l;
    }

    console.log("Label Distribution:");
    Object.keys(counts).sort((a, b) => a - b).forEach(k => {
        console.log(`  ${k}: ${counts[k]}`);
    });

    if (min < 0 || max > 10) {
        console.error(`ERROR: Labels out of range [0, 10]: ${min} to ${max}`);
    } else {
        console.log("Labels are within valid range [0, 10].");
    }

    // Check for NaNs in images (only check first few and random ones to save time)
    console.log("Checking for NaNs in images...");
    let nans = 0;
    for (let i = 0; i < count; i += (count > 2000 ? 10 : 1)) {
        const img = data.images[i];
        if (img.length !== 784) {
            console.error(`Image ${i} has wrong length ${img.length}`);
        }
        for (const p of img) {
            if (isNaN(p)) {
                nans++;
                break;
            }
        }
    }

    if (nans > 0) {
        console.error(`Found ${nans} images with NaNs (sampled).`);
    } else {
        console.log("No NaNs found in sampled images.");
    }
}

verify();
