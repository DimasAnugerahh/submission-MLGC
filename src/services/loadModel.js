const tf = require('@tensorflow/tfjs-node');
 
async function loadModel() {
    return tf.loadGraphModel(process.env.MODELS);
}
 
module.exports = loadModel;