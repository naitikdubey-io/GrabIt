import numpy as np

class HiringNeuralNetwork:
    def __init__(self, input_size=4, hidden_size=6, output_size=1):
        # Hyperparameters
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        self.learning_rate = 0.5

        # Initialize weights with random values
        # Weights from Input to Hidden layer
        self.weights_ih = np.random.uniform(-1, 1, (self.input_size, self.hidden_size))
        # Weights from Hidden to Output layer
        self.weights_ho = np.random.uniform(-1, 1, (self.hidden_size, self.output_size))

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def sigmoid_derivative(self, x):
        return x * (1 - x)

    def predict(self, inputs):
        # Forward pass
        # 1. Input to Hidden
        self.hidden_input = np.dot(inputs, self.weights_ih)
        self.hidden_output = self.sigmoid(self.hidden_input)

        # 2. Hidden to Output
        self.final_input = np.dot(self.hidden_output, self.weights_ho)
        self.final_output = self.sigmoid(self.final_input)
        
        return self.final_output

    def train(self, inputs, targets, epochs=5000):
        print(f"Starting training for {epochs} epochs...")
        for epoch in range(epochs):
            # Forward Pass
            output = self.predict(inputs)

            # Backward Pass (Backpropagation)
            # 1. Calculate output error
            output_error = targets - output
            output_delta = output_error * self.sigmoid_derivative(output)

            # 2. Calculate hidden layer error
            hidden_error = output_delta.dot(self.weights_ho.T)
            hidden_delta = hidden_error * self.sigmoid_derivative(self.hidden_output)

            # 3. Update weights
            self.weights_ho += self.hidden_output.T.dot(output_delta) * self.learning_rate
            self.weights_ih += inputs.T.dot(hidden_delta) * self.learning_rate
            
            if epoch % 1000 == 0:
                loss = np.mean(np.square(output_error))
                print(f"Epoch {epoch}, Loss: {loss:.6f}")

# --- SETUP THE MODEL ---

# Training Data: [Tech, Behavioral, Stability, BodyLanguage]
X = np.array([
    [0.9, 0.8, 0.9, 0.9], # Rockstar
    [0.1, 0.2, 0.1, 0.1], # Poor fit
    [0.8, 0.2, 0.8, 0.8], # Tech okay, behavioral poor
    [0.2, 0.9, 0.8, 0.9], # Soft skills star, tech weak
    [0.7, 0.7, 0.7, 0.7], # Solid average
    [1.0, 0.0, 1.0, 1.0], # Genius but zero soft skills
    [0.5, 0.5, 0.5, 1.0]  # Average but high presence
])

# Targets: [Hire Probability]
y = np.array([
    [0.95],
    [0.05],
    [0.4],
    [0.6],
    [0.75],
    [0.3],
    [0.65]
])

# Initialize and Train
model = HiringNeuralNetwork()
model.train(X, y)

# --- TEST THE MODEL ---
print("\n--- Model Predictions ---")
test_cases = [
    ([0.95, 0.9, 0.95, 0.9], "Elite Candidate"),
    ([0.2, 0.2, 0.3, 0.2], "Unprepared Candidate"),
    ([0.8, 0.8, 0.8, 0.2], "Strong Skills, Low Presence")
]

for inputs, label in test_cases:
    prediction = model.predict(np.array([inputs]))
    score = float(prediction[0] * 100)
    verdict = "HIRE" if score > 70 else "REJECT"
    print(f"{label}: Score={score:.2f}% | Verdict={verdict}")
