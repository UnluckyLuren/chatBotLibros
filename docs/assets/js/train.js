// Tensorflow
// npm install @tensorflow/tfjs
// Compilador universal 
// npm install @tensorflow/tfjs @tensorflow-models/universal-sentence-encoder --legacy-peer-deps
// Para entrenar
// node ./src/assets/js/train.js

// Imports
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import trainingData from './datosEntrenamiento.js';

// Reemplazo para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Mapear intenciones a un índice numérico (el modelo no entiende texto)
const intentions = [...new Set(trainingData.map(item => item.intencion))];
console.log('Intenciones a entrenar:', intentions);

// Preparar los datos
const texts = trainingData.map(item => item.frase);
const labels = trainingData.map(item => {
  const index = intentions.indexOf(item.intencion);
  // Convertir a "one-hot encoding"
  return tf.tensor1d(Array(intentions.length).fill(0).map((_, i) => i === index ? 1 : 0));
});

// Combinar los tensores de etiquetas en uno solo
const trainingLabels = tf.stack(labels);

async function trainModel() {
  
  // Declarar variables fuera del try
  let sentenceEncoder;
  let trainingEmbeddings;
  let model;

  console.log('Cargando Universal Sentence Encoder...');
  
  try {
    // Asignar valores
    sentenceEncoder = await use.load();

    console.log('Codificando frases de entrenamiento (esto puede tardar)...');
    trainingEmbeddings = await sentenceEncoder.embed(texts);

    // Definir el modelo de IA
    model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [trainingEmbeddings.shape[1]], // 512 para el USE
      units: 128,
      activation: 'relu'
    }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu'
    }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({
      units: intentions.length, // Número de intenciones
      activation: 'softmax' // Para clasificación de múltiples clases
    }));

    // Compilar el modelo
    model.compile({
      loss: 'categoricalCrossentropy',
      optimizer: 'adam',
      metrics: ['accuracy']
    });

    console.log('Iniciando entrenamiento...');
    await model.fit(trainingEmbeddings, trainingLabels, {
      epochs: 100,
      shuffle: true,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
        }
      }
    });

    // Guardar el modelo en carpeta ./model
    const modelDir = path.join(__dirname,'..','..', 'model');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir);
    }

    // Handler para guardar el MANIFIESTO
    const handler = tf.io.withSaveHandler(async (artifacts) => {
        // Crear el objeto MANIFEST
        const manifest = {
            modelTopology: artifacts.modelTopology,
            weightsManifest: [{
                paths: ['./weights.bin'], // Ruta relativa al model.json
                weights: artifacts.weightSpecs // Especificaciones de los pesos
            }]
        };
        
        // Guardar el MANIFEST como model.json
        fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(manifest));
        
        // Guardar los pesos 
        if (artifacts.weightData) {
            fs.writeFileSync(path.join(modelDir, 'weights.bin'), Buffer.from(artifacts.weightData));
        }
        
        console.log('Modelo (manifest y weights) guardado correctamente en ./model');
        return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
    });

    await model.save(handler);

    console.log('¡Entrenamiento completo! Modelo guardado en la carpeta ./model');

  } catch (error) {
    console.error("Error catastrófico durante el entrenamiento:", error);
  
  } finally {
    // Limpieza en 'finally'
    console.log("Iniciando limpieza de memoria...");
    
    // Comprueba si las variables llegaron a crearse antes de limpiarlas
    if (model) {
      model.dispose();
      console.log("Modelo limpiado.");
    }
    if (trainingEmbeddings) {
      trainingEmbeddings.dispose();
      console.log("Embeddings limpiados.");
    }

    labels.forEach(tensor => tensor.dispose());
    trainingLabels.dispose();
    console.log("Etiquetas limpiadas. Limpieza completa.");
  }
}

// Iniciar el proceso
trainModel();