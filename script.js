// Get DOM elements
const video = document.getElementById('webcam');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const responseDiv = document.getElementById('response');

// Set canvas dimensions to match video feed
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Three.js variables
let scene, camera, renderer, cube;

// Function to set up the webcam (with back camera)
async function setupWebcam() {
    try {
        const constraints = {
            video: {
                facingMode: { exact: "environment" } // Use the back camera
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (error) {
        console.error("Error accessing the webcam:", error);
        alert("Unable to access the back camera. Please ensure it is connected and permissions are granted.");
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

// Function to initialize Three.js scene
function initThreeJS() {
    // Create a scene
    scene = new THREE.Scene();

    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create a renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a 3D cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
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

        // Control 3D object based on hand position
        control3DObject(landmarks);
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

// Function to control 3D object based on hand position
function control3DObject(landmarks) {
    // Get the index finger tip position
    const indexTip = landmarks[8]; // Index finger tip landmark

    // Map hand position to 3D object position
    const x = (indexTip[0] / canvas.width) * 4 - 2; // Map X coordinate
    const y = -(indexTip[1] / canvas.height) * 4 + 2; // Map Y coordinate

    // Update cube position
    cube.position.x = x;
    cube.position.y = y;

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene
    renderer.render(scene, camera);
}

// Initialize the project
async function init() {
    // Set up the webcam (back camera)
    await setupWebcam();

    // Load the Handpose model
    const model = await loadHandposeModel();

    // Initialize Three.js
    initThreeJS();

    // Start detecting hand gestures
    detectHandGestures(model);
}

// Run the initialization function
init();
