const tf = require('@tensorflow/tfjs');
const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

// Custom file saver
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

            const modelTopology = modelArtifacts.modelTopology;

            fs.writeFileSync(
                `${dir}/model.json`,
                JSON.stringify({ modelTopology, weightsManifest }, null, 2)
            );

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

// Create model
function createModel() {
    const model = tf.sequential();

    model.add(tf.layers.conv2d({
        inputShape: [28, 28, 1],
        kernelSize: 3,
        filters: 16,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.conv2d({
        kernelSize: 3,
        filters: 32,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal'
    }));
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

// Generate synthetic batch
async function generateBatch(batchSize, font) {
    const images = [];
    const labels = [];

    const canvas = PImage.make(28, 28);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < batchSize; i++) {
        // Clear
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 28, 28);

        // 15% empty
        const isEmpty = Math.random() < 0.15;
        const label = isEmpty ? 10 : Math.floor(Math.random() * 10);

        if (!isEmpty) {
            // Draw digit
            const fontSize = 16 + Math.floor(Math.random() * 8);
            ctx.font = `${fontSize}pt Arial`;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const dx = (Math.random() - 0.5) * 3;
            const dy = (Math.random() - 0.5) * 3;
            const angle = (Math.random() - 0.5) * 0.2;

            ctx.save();
            ctx.translate(14 + dx, 14 + dy);
            ctx.rotate(angle);
            ctx.fillText(label.toString(), 0, 0);
            ctx.restore();

            // Add grid lines (30% chance each edge)
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1 + Math.random();
            if (Math.random() < 0.3) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(28, 0);
                ctx.stroke();
            }
            if (Math.random() < 0.3) {
                ctx.beginPath();
                ctx.moveTo(0, 28);
                ctx.lineTo(28, 28);
                ctx.stroke();
            }
            if (Math.random() < 0.3) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 28);
                ctx.stroke();
            }
            if (Math.random() < 0.3) {
                ctx.beginPath();
                ctx.moveTo(28, 0);
                ctx.lineTo(28, 28);
                ctx.stroke();
            }
        }

        // Convert to normalized array
        const data = canvas.data;
        const pixels = new Float32Array(28 * 28);
        for (let j = 0; j < 28 * 28; j++) {
            const val = data[j * 4]; // R channel
            pixels[j] = (255 - val) / 255.0; // Invert and normalize
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

    // Load font
    const fontPath = 'C:\\\\Windows\\\\Fonts\\\\arial.ttf';
    const font = PImage.registerFont(fontPath, 'Arial');
    await font.loadSync();
    console.log('Font loaded.');

    console.log('Creating model...');
    const model = createModel();

    console.log('Training...');
    const BATCH_SIZE = 64;
    const BATCHES_PER_EPOCH = 50;
    const EPOCHS = 15;

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
