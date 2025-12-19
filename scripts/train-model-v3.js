const tf = require('@tensorflow/tfjs');
const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

// File saver
function fileSystemSaver(savePath) {
    return {
        save: async (modelArtifacts) => {
            const dir = savePath;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const weightsManifest = [{
                paths: ['./weights.bin'],
                weights: modelArtifacts.weightSpecs
            }];

            fs.writeFileSync(
                `${dir}/model.json`,
                JSON.stringify({ modelTopology: modelArtifacts.modelTopology, weightsManifest }, null, 2)
            );

            if (modelArtifacts.weightData) {
                fs.writeFileSync(`${dir}/weights.bin`, Buffer.from(modelArtifacts.weightData));
            }

            return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
        }
    };
}

// Create model
function createModel() {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [28, 28, 1],
        kernelSize: 3,
        filters: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.dropout({ rate: 0.25 }));

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    model.add(tf.layers.dense({
        units: 11,
        activation: 'softmax',
        kernelInitializer: 'glorotUniform'
    }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
}

// REALISTIC data generation - matches actual Sudoku cells
async function generateBatch(batchSize, font) {
    const images = [];
    const labels = [];

    const canvas = PImage.make(28, 28);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < batchSize; i++) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 28, 28);

        // 15% empty cells
        const isEmpty = Math.random() < 0.15;
        const label = isEmpty ? 10 : Math.floor(Math.random() * 10);

        if (!isEmpty) {
            // Draw digit with variation
            const fontSize = 14 + Math.floor(Math.random() * 10); // 14-24pt
            ctx.font = `${fontSize}pt Arial`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // More variation in position
            const dx = (Math.random() - 0.5) * 6;
            const dy = (Math.random() - 0.5) * 6;
            const angle = (Math.random() - 0.5) * 0.3;

            ctx.save();
            ctx.translate(14 + dx, 14 + dy);
            ctx.rotate(angle);
            ctx.fillText(label.toString(), 0, 0);
            ctx.restore();

            // CRITICAL: Add THICK grid lines like real Sudoku (50% chance each edge)
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2 + Math.random() * 2; // 2-4px thick

            if (Math.random() < 0.5) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(28, 0);
                ctx.stroke();
            }
            if (Math.random() < 0.5) {
                ctx.beginPath();
                ctx.moveTo(0, 28);
                ctx.lineTo(28, 28);
                ctx.stroke();
            }
            if (Math.random() < 0.5) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 28);
                ctx.stroke();
            }
            if (Math.random() < 0.5) {
                ctx.beginPath();
                ctx.moveTo(28, 0);
                ctx.lineTo(28, 28);
                ctx.stroke();
            }

            // Add noise/artifacts
            const noiseCount = Math.floor(Math.random() * 10);
            for (let n = 0; n < noiseCount; n++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'black' : '#ccc';
                const s = Math.random() * 2;
                ctx.fillRect(Math.random() * 28, Math.random() * 28, s, s);
            }

            // Simulate shadows/lighting (darken or lighten randomly)
            const brightness = 0.8 + Math.random() * 0.4; // 0.8-1.2
            if (brightness !== 1.0) {
                const imgData = ctx.getImageData(0, 0, 28, 28);
                for (let j = 0; j < imgData.data.length; j += 4) {
                    imgData.data[j] = Math.min(255, imgData.data[j] * brightness);
                    imgData.data[j + 1] = Math.min(255, imgData.data[j + 1] * brightness);
                    imgData.data[j + 2] = Math.min(255, imgData.data[j + 2] * brightness);
                }
                ctx.putImageData(imgData, 0, 0);
            }
        }

        // Convert to normalized array
        const data = canvas.data;
        const pixels = new Float32Array(28 * 28);
        for (let j = 0; j < 28 * 28; j++) {
            const val = data[j * 4];
            pixels[j] = (255 - val) / 255.0;
        }

        images.push(pixels);
        labels.push(label);
    }

    // Create tensors
    const totalPixels = batchSize * 28 * 28;
    const allPixels = new Float32Array(totalPixels);
    for (let i = 0; i < batchSize; i++) {
        allPixels.set(images[i], i * 28 * 28);
    }

    const xs = tf.tensor4d(allPixels, [batchSize, 28, 28, 1]);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 11);

    return { xs, ys };
}

async function run() {
    console.log('Setup...');

    const fontPath = 'C:\\\\Windows\\\\Fonts\\\\arial.ttf';
    const font = PImage.registerFont(fontPath, 'Arial');
    await font.loadSync();
    console.log('Font loaded.');

    console.log('Creating IMPROVED model (deeper, with dropout)...');
    const model = createModel();

    console.log('Training with REALISTIC augmentation...');
    const BATCH_SIZE = 64;
    const BATCHES_PER_EPOCH = 40; // Reduced for faster training
    const EPOCHS = 20; // More epochs for better learning

    for (let epoch = 0; epoch < EPOCHS; epoch++) {
        let totalLoss = 0;
        let totalAcc = 0;

        for (let batch = 0; batch < BATCHES_PER_EPOCH; batch++) {
            const { xs, ys } = await generateBatch(BATCH_SIZE, font);

            const history = await model.fit(xs, ys, {
                epochs: 1,
                verbose: 0
            });

            totalLoss += history.history.loss[0];
            totalAcc += history.history.acc[0];

            xs.dispose();
            ys.dispose();

            process.stdout.write('.');
        }

        const avgLoss = totalLoss / BATCHES_PER_EPOCH;
        const avgAcc = totalAcc / BATCHES_PER_EPOCH;
        console.log(`\\nEpoch ${epoch + 1}/${EPOCHS} - Loss: ${avgLoss.toFixed(4)}, Acc: ${(avgAcc * 100).toFixed(2)}%`);
    }

    console.log('Saving model...');
    const saveDir = path.resolve(__dirname, '../public/models/digit-recognition');
    await model.save(fileSystemSaver(saveDir));
    console.log('Done!');
}

run().catch(console.error);
