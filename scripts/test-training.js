
const tf = require('@tensorflow/tfjs');
const PImage = require('pureimage');
const fs = require('fs');
const path = require('path');

// Minimal synthetic training test
console.log("Starting synthetic-only test...");

function createModel() {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({ inputShape: [28, 28, 1], kernelSize: 3, filters: 16, activation: 'relu' }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 11, activation: 'softmax' }));

    // Use SGD with very conservative LR
    model.compile({
        optimizer: tf.train.sgd(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });
    return model;
}

// Simplified generation without complex setup
async function run() {
    const fontPath = 'C:\\Windows\\Fonts\\arial.ttf';
    const font = PImage.registerFont(fontPath, 'Arial');
    await font.loadSync();

    const model = createModel();
    console.log("Model created.");

    // Generate one batch
    const batchSize = 32;
    const images = [];
    const labels = [];
    const img = PImage.make(28, 28);
    const ctx = img.getContext('2d');

    for (let i = 0; i < batchSize; i++) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 28, 28);
        ctx.fillStyle = 'black';
        ctx.font = "20pt Arial";
        ctx.fillText(Math.floor(Math.random() * 10).toString(), 5, 20);

        const data = img.data;
        const floatData = new Float32Array(28 * 28);
        for (let j = 0; j < 28 * 28; j++) {
            floatData[j] = (255 - data[j * 4]) / 255.0; // Simple normalize
        }
        images.push(floatData);
        labels.push(i % 10);
    }

    const totalSize = batchSize * 28 * 28;
    const allPixels = new Float32Array(totalSize);
    for (let k = 0; k < batchSize; k++) {
        allPixels.set(images[k], k * 28 * 28);
    }

    const xs = tf.tensor4d(allPixels, [batchSize, 28, 28, 1]);
    const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 11);

    console.log("Training for 2 epochs...");
    await model.fit(xs, ys, {
        epochs: 2,
        callbacks: {
            onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch}: loss=${logs.loss}`)
        }
    });
}

run().catch(console.error);
