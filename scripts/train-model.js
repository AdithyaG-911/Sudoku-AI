
const tf = require('@tensorflow/tfjs');
const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

// Custom file saver
function fileSystemSaver(path) {
    return {
        save: async (modelArtifacts) => {
            const dir = path;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const weightsManifest = [{
                paths: ['./weights.bin'],
                weights: modelArtifacts.weightSpecs
            }];

            const modelTopology = modelArtifacts.modelTopology;

            // Save model.json
            fs.writeFileSync(
                `${dir}/model.json`,
                JSON.stringify({ modelTopology, weightsManifest }, null, 2)
            );

            // Save weights.bin
            if (modelArtifacts.weightData) {
                const buffer = Buffer.from(modelArtifacts.weightData);
                fs.writeFileSync(`${dir}/weights.bin`, buffer);
            }

            return {
                modelArtifactsInfo: {
                    dateSaved: new Date(),
                    modelTopologyType: 'JSON',
                }
            };
        }
    };
}

// Define the model architecture
function createModel() {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [28, 28, 1],
        kernelSize: 3,
        filters: 16,
        activation: 'relu'
    }));

    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 32,
        activation: 'relu'
    }));

    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.flatten());

    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));

    model.add(tf.layers.dense({ units: 11, activation: 'softmax' }));

    model.compile({
        optimizer: tf.train.sgd(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

// Font setup for synthetic data
async function setupFont() {
    // Attempt to locate a font. Windows defaults.
    const fonts = [
        'C:\\Windows\\Fonts\\arial.ttf',
        'C:\\Windows\\Fonts\\tahoma.ttf',
        'C:\\Windows\\Fonts\\seguiemj.ttf'
    ];

    for (const fontPath of fonts) {
        if (fs.existsSync(fontPath)) {
            console.log(`Loading font from ${fontPath}...`);
            const font = PImage.registerFont(fontPath, 'Arial');
            await font.loadSync();
            return true;
        }
    }
    console.warn("Could not find a standard Windows font. Synthetic data might be empty.");
    return false;
}

// Synthetic Generation
// Enhanced Synthetic Generation mimicking Sudoku cells
function generateSyntheticBatch(batchSize, fontLoaded) {
    const images = [];
    const labels = [];

    const img = PImage.make(28, 28);
    const ctx = img.getContext('2d');

    for (let i = 0; i < batchSize; i++) {
        // Clear background (White)
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 28, 28);

        // 15% chance of empty cell
        const isBlank = Math.random() < 0.15;
        let label = isBlank ? 10 : Math.floor(Math.random() * 10);

        if (!isBlank && fontLoaded) {
            // Randomize font size and style
            const fontSize = Math.floor(Math.random() * 12) + 16; // 16-28pt
            ctx.font = `${fontSize}pt Arial`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.save();
            // Random transformations
            const angle = (Math.random() - 0.5) * 0.3; // Slight rotation
            const dx = (Math.random() - 0.5) * 4; // Slight shift
            const dy = (Math.random() - 0.5) * 4;

            ctx.translate(14 + dx, 14 + dy);
            ctx.rotate(angle);
            ctx.fillText(label.toString(), 0, 0);
            ctx.restore();
        }

        // --- Augmentations to mimic Real Sudoku Cells ---

        // 1. Grid Lines (The most common artifact)
        ctx.lineWidth = Math.random() * 3 + 1; // Thick lines
        ctx.strokeStyle = 'black';

        // Top border?
        if (Math.random() < 0.3) {
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(28, 0); ctx.stroke();
        }
        // Bottom border?
        if (Math.random() < 0.3) {
            ctx.beginPath(); ctx.moveTo(0, 28); ctx.lineTo(28, 28); ctx.stroke();
        }
        // Left border?
        if (Math.random() < 0.3) {
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 28); ctx.stroke();
        }
        // Right border?
        if (Math.random() < 0.3) {
            ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(28, 28); ctx.stroke();
        }

        // 2. Random Noise / dots
        const noiseCount = Math.floor(Math.random() * 8);
        for (let n = 0; n < noiseCount; n++) {
            ctx.fillStyle = Math.random() < 0.5 ? 'black' : '#ccc';
            const s = Math.random() * 2;
            ctx.fillRect(Math.random() * 28, Math.random() * 28, s, s);
        }

        // Process pixel data
        const data = img.data;
        const float32Data = new Float32Array(28 * 28);
        for (let j = 0; j < 28 * 28; j++) {
            const val = data[j * 4];
            // Normalize to [0, 1]
            let normalized = (255 - val) / 255.0;

            // Artificial blurry noise
            if (Math.random() < 0.1) {
                normalized += (Math.random() - 0.5) * 0.1;
            }

            float32Data[j] = Math.max(0, Math.min(1, normalized));
            if (isNaN(float32Data[j])) float32Data[j] = 0;
        }

        images.push(float32Data);
        labels.push(label);
    }

    // Convert to Tensors
    const totalSize = batchSize * 28 * 28;
    const allPixels = new Float32Array(totalSize);
    for (let k = 0; k < batchSize; k++) {
        allPixels.set(images[k], k * 28 * 28);
    }

    return {
        xs: tf.tensor4d(allPixels, [batchSize, 28, 28, 1]),
        ys: tf.oneHot(tf.tensor1d(labels, 'int32'), 11)
    };
}

async function run() {
    console.log('Setup...');
    const fontLoaded = await setupFont();
    // SKIP Real Dataset loading to prevent contamination
    console.log('Using STRICTLY SYNTHETIC training per user request.');

    console.log('Creating model...');
    const model = createModel();

    console.log('Training...');
    const BATCH_SIZE = 64;
    const BATCHES_PER_EPOCH = 50;
    const EPOCHS = 10; // Increased epochs since synthetic is fast/clean

    const args = process.argv.slice(2);
    const useRealData = args.includes('--real');

    if (useRealData) {
        console.log('Loading REAL DATASET...');
        const realDataPath = path.join(__dirname, '../data/real-data.json');
        if (!fs.existsSync(realDataPath)) {
            throw new Error(`Real dataset not found at ${realDataPath}, run process-dataset.js first.`);
        }
        const dataset = JSON.parse(fs.readFileSync(realDataPath));
        console.log(`Loaded ${dataset.labels.length} samples.`);

        // Shuffle
        const indices = Array.from({ length: dataset.labels.length }, (_, i) => i);
        tf.util.shuffle(indices);

        const shuffledImages = new Float32Array(dataset.labels.length * 784);
        const shuffledLabels = [];

        for (let i = 0; i < dataset.labels.length; i++) {
            const idx = indices[i];
            shuffledImages.set(dataset.images[idx], i * 784);
            shuffledLabels.push(dataset.labels[idx]);
        }

        const xs = tf.tensor4d(shuffledImages, [dataset.labels.length, 28, 28, 1]);
        const ys = tf.oneHot(tf.tensor1d(shuffledLabels, 'int32'), 11);

        console.log('Starting training on real data...');
        await model.fit(xs, ys, {
            epochs: 50, // More epochs for real data
            batchSize: 64,
            shuffle: true,
            validationSplit: 0.1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}, val_loss=${logs.val_loss?.toFixed(4)}, val_acc=${logs.val_acc?.toFixed(4)}`);
                }
            }
        });

        xs.dispose();
        ys.dispose();

    } else {
        // SYNTHETIC LOOP
        for (let epoch = 0; epoch < EPOCHS; epoch++) {
            let totalLoss = 0;
            for (let batch = 0; batch < BATCHES_PER_EPOCH; batch++) {
                // Pure Synthetic
                const synBatch = generateSyntheticBatch(BATCH_SIZE, fontLoaded);

                // Safety Clip
                const finalXs = synBatch.xs.clipByValue(0, 1);
                const finalYs = synBatch.ys;

                const history = await model.trainOnBatch(finalXs, finalYs);
                totalLoss += history;

                finalXs.dispose();
                finalYs.dispose();
                synBatch.xs.dispose(); // Ensure disposal
                synBatch.ys.dispose();

                process.stdout.write('.');
            }
            console.log(`\nEpoch ${epoch + 1} complete (Loss: ${(totalLoss / BATCHES_PER_EPOCH).toFixed(4)})`);
        }
    }

    console.log('Saving model...');
    const saveDir = path.resolve(__dirname, '../public/models/digit-recognition');

    await model.save(fileSystemSaver(saveDir));
    console.log('Done!');
}

run().catch(console.error);
