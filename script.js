// Get DOM elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const responseDiv = document.getElementById('response');

// Set canvas dimensions to match video feed
canvas.width = 640;
canvas.height = 480;

// Function to set up the webcam
async function setupWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing the webcam:", error);
        alert("Unable to access the webcam. Please ensure it is connected and permissions are granted.");
    }
}

// Function to load the Handpose model
async function loadHandposeModel() {
    try {
        const model = await handpose.load();
        console.log("Handpose model loaded successfully.");
        return model;
    } catch (error) {
        console.error("Error loading the Handpose model:", error);
        alert("Failed to load the Handpose model. Please check your internet connection.");
    }
}

// Function to detect hand gestures
async function detectHandGestures(model) {
    if (!model) return;

    // Get hand predictions
    const predictions = await model.estimateHands(video);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (predictions.length > 0) {
        // Draw hand landmarks
        const landmarks = predictions[0].landmarks;
        drawHand(landmarks);

        // Check for specific gestures
        checkGesture(landmarks);
    } else {
        responseDiv.textContent = "No hand detected.";
    }

    // Continuously detect gestures
    requestAnimationFrame(() => detectHandGestures(model));
}

// Function to draw hand landmarks on the canvas
function drawHand(landmarks) {
    ctx.fillStyle = 'red';
    for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw a circle for each landmark
        ctx.fill();
    }
}

// Function to check for specific gestures
function checkGesture(landmarks) {
    // Get key landmarks
    const thumbTip = landmarks[4];  // Thumb tip
    const indexTip = landmarks[8];  // Index finger tip
    const middleTip = landmarks[12]; // Middle finger tip
    const ringTip = landmarks[16];  // Ring finger tip
    const pinkyTip = landmarks[20]; // Pinky finger tip

    // Check for "Open Hand" gesture
    const isHandOpen = thumbTip[1] < indexTip[1] && indexTip[1] < middleTip[1] && middleTip[1] < ringTip[1] && ringTip[1] < pinkyTip[1];

    // Check for "Closed Fist" gesture
    const isHandClosed = thumbTip[1] > indexTip[1] && indexTip[1] > middleTip[1] && middleTip[1] > ringTip[1] && ringTip[1] > pinkyTip[1];

    // Update response based on gesture
    if (isHandOpen) {
        responseDiv.textContent = "Hand Open Detected! 🖐️";
    } else if (isHandClosed) {
        responseDiv.textContent = "Closed Fist Detected! ✊";
    } else {
        responseDiv.textContent = "No specific gesture detected.";
    }
}

// Initialize the project
async function init() {
    // Set up the webcam
    await setupWebcam();

    // Load the Handpose model
    const model = await loadHandposeModel();

    // Start detecting hand gestures
    detectHandGestures(model);
}

// Run the initialization function
init();
