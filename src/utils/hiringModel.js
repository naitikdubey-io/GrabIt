/**
 * Custom Neural Network (MLP) - Built from Scratch
 * Fulfills the objective of implementing a custom DL model.
 * 
 * Features: 
 * - Input Layer (4 neurons: Tech, Behavioral, Stability, BodyLanguage)
 * - Hidden Layer (6 neurons)
 * - Output Layer (1 neuron: Hire Probability)
 * - Sigmoid Activation & Backpropagation
 */

class NeuralNetwork {
  constructor() {
    this.inputSize = 4;
    this.hiddenSize = 6;
    this.outputSize = 1;
    this.learningRate = 0.5;

    // Initialize weights with random values
    this.weightsIH = Array.from({ length: this.inputSize }, () =>
      Array.from({ length: this.hiddenSize }, () => Math.random() * 2 - 1)
    );
    this.weightsHO = Array.from({ length: this.hiddenSize }, () =>
      Array.from({ length: this.outputSize }, () => Math.random() * 2 - 1)
    );
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  sigmoidDerivative(x) {
    return x * (1 - x);
  }

  predict(inputs) {
    // 1. Input to Hidden
    this.hidden = Array(this.hiddenSize).fill(0);
    for (let j = 0; j < this.hiddenSize; j++) {
      let sum = 0;
      for (let i = 0; i < this.inputSize; i++) {
        sum += inputs[i] * this.weightsIH[i][j];
      }
      this.hidden[j] = this.sigmoid(sum);
    }

    // 2. Hidden to Output
    this.output = Array(this.outputSize).fill(0);
    for (let k = 0; k < this.outputSize; k++) {
      let sum = 0;
      for (let j = 0; j < this.hiddenSize; j++) {
        sum += this.hidden[j] * this.weightsHO[j][k];
      }
      this.output[k] = this.sigmoid(sum);
    }

    return this.output;
  }

  train(inputs, targets) {
    // Forward pass
    this.predict(inputs);

    // Calculate output error
    let outputErrors = Array(this.outputSize).fill(0);
    for (let k = 0; k < this.outputSize; k++) {
      outputErrors[k] = targets[k] - this.output[k];
    }

    // Calculate hidden errors
    let hiddenErrors = Array(this.hiddenSize).fill(0);
    for (let j = 0; j < this.hiddenSize; j++) {
      let error = 0;
      for (let k = 0; k < this.outputSize; k++) {
        error += outputErrors[k] * this.weightsHO[j][k];
      }
      hiddenErrors[j] = error;
    }

    // Update weights: Hidden to Output
    for (let k = 0; k < this.outputSize; k++) {
      let gradient = outputErrors[k] * this.sigmoidDerivative(this.output[k]);
      for (let j = 0; j < this.hiddenSize; j++) {
        this.weightsHO[j][k] += this.learningRate * gradient * this.hidden[j];
      }
    }

    // Update weights: Input to Hidden
    for (let j = 0; j < this.hiddenSize; j++) {
      let gradient = hiddenErrors[j] * this.sigmoidDerivative(this.hidden[j]);
      for (let i = 0; i < this.inputSize; i++) {
        this.weightsIH[i][j] += this.learningRate * gradient * inputs[i];
      }
    }
  }
}

// Singleton instance of our model
export const hiringModel = new NeuralNetwork();

// Training Data: [Tech, Behavioral, Stability, BodyLanguage] -> [HireProbability]
// Values are normalized between 0 and 1
const trainingData = [
  { input: [0.9, 0.8, 0.9, 0.9], target: [0.95] }, // Rockstar
  { input: [0.1, 0.2, 0.1, 0.1], target: [0.05] }, // Poor fit
  { input: [0.8, 0.2, 0.8, 0.8], target: [0.4] },  // Tech okay, behavioral poor
  { input: [0.2, 0.9, 0.8, 0.9], target: [0.6] },  // Soft skills star, tech weak
  { input: [0.7, 0.7, 0.7, 0.7], target: [0.75] }, // Solid average
  { input: [1.0, 0.0, 1.0, 1.0], target: [0.3] },  // Genius but zero soft skills
  { input: [0.5, 0.5, 0.5, 1.0], target: [0.65] }, // Average but high presence
];

export const trainHiringModel = (epochs = 1000) => {
  console.log("Neural Network: Training started from scratch...");
  for (let i = 0; i < epochs; i++) {
    trainingData.forEach(item => {
      hiringModel.train(item.input, item.target);
    });
  }
  console.log("Neural Network: Training complete.");
};
