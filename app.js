// REAL-TIME CLOCK
// const dateTimeDisplay = document.getElementById('dateTimeDisplay');

// Updates the date and time display every second.
function updateDateTime() {
    const now = new Date();
    
    // Options for date formatting
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, dateOptions);
    
    // Options for time formatting (includes seconds)
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = now.toLocaleTimeString(undefined, timeOptions);
    
    // Combine and display
    dateTimeDisplay.innerHTML = `${dateString} | ${timeString}`;
}

// Start the clock and update it every 1000ms (1 second)
setInterval(updateDateTime, 1000);

// Initial call to display the time
updateDateTime();

// Constants for calculation
const STEP_LENGTH_M = 0.76; // Average adult step length in meters

// Element References
const distanceElement = document.getElementById('distanceDisplay');
const durationElement = document.getElementById('durationDisplay');

// NEW State Variables
let timerInterval = null; 
let durationSeconds = 0; 

// Formats total seconds into a clean HH:MM:SS string.
function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Updates the duration every second.
function updateDurationDisplay() {
    durationSeconds++;
    durationElement.textContent = formatDuration(durationSeconds);
}
    
    // --- Core Logic ---
    // Sensor Constants
    const ACCELERATION_THRESHOLD = 1.25; // Threshold for Z-axis acceleration
    const STEP_DEBOUNCE_TIME = 200;    // Milliseconds to wait before registering another step

    // DOM Elements
    const stepsElement = document.getElementById('steps');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const statusMessage = document.getElementById('statusMessage');
    const counterDisplay = document.getElementById('counterDisplay');
    const warningBox = document.getElementById('warningBox');
    const notSupportedBox = document.getElementById('notSupportedBox');

    // State Variables
    let stepCount = 0;
    let isRunning = false;
    let lastStepTime = 0;
    let lastZ = 0;

    // Checks support and handles permission request on click.
    async function requestSensorAccess() {
        if (isRunning) {
            // If already running, treat the button click as a stop command
            toggleCounting();
            return;
        }

        // Check if DeviceMotion is supported
        if (!('DeviceMotionEvent' in window)) {
            notSupportedBox.classList.remove('hidden');
            statusMessage.textContent = "Motion sensor not supported.";
            return;
        }

        // iOS 13+ requires explicit permission request
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
            warningBox.classList.remove('hidden');
            try {
                const permissionState = await DeviceMotionEvent.requestPermission();
                warningBox.classList.add('hidden');
                if (permissionState === 'granted') {
                    toggleCounting(true);
                } else {
                    statusMessage.textContent = "Permission denied. Cannot track steps.";
                    startButton.textContent = "Permission Denied";
                    startButton.disabled = true;
                }
            } catch (error) {
                console.error("Error requesting motion permission:", error);
                statusMessage.textContent = "Error requesting motion permission.";
            }
        } else {
            // For Android and other browsers
            toggleCounting(true);
        }
    }

    /**
     * Detecting steps based on device acceleration.
     * Look for significant changes in the Z-axis (up/down movement).
     * @param {DeviceMotionEvent} event
     */

    function handleDeviceMotion(event) {
        if (!isRunning) return;
        // Use accelerationIncludingGravity for robust detection
        const currentZ = event.accelerationIncludingGravity.z;
        const timeNow = Date.now();
        // Calculate the change in acceleration
        const deltaZ = currentZ - lastZ;
        // Check for a sharp acceleration change (a 'step')
        if (Math.abs(deltaZ) > ACCELERATION_THRESHOLD && (timeNow - lastStepTime) > STEP_DEBOUNCE_TIME) {
            // Simple peak detection
            stepCount++;
            stepsElement.textContent = stepCount;
            const distanceKM = (stepCount * STEP_LENGTH_M) / 1000;
            distanceElement.textContent = distanceKM.toFixed(2);
            lastStepTime = timeNow;
        }
        // Update the last Z value
        lastZ = currentZ;
    }

    // Starts or stops the step counting process.

    function toggleCounting(forceStart = null) {
        const shouldRun = forceStart !== null ? forceStart : !isRunning;
        if (shouldRun) {
            // Start Tracking
            window.addEventListener('devicemotion', handleDeviceMotion);
            if (!timerInterval) {
                timerInterval = setInterval(updateDurationDisplay, 1000); 
            }
            startButton.textContent = "Stop Tracking";
            // Set to RED (Stop Tracking state)
            startButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700'); 
            startButton.classList.add('bg-red-500', 'hover:bg-red-600');
            
            statusMessage.textContent = "Tracking active. Start walking!";
            counterDisplay.classList.add('running');
            isRunning = true;
        } else {              
            // Stop Tracking
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            window.removeEventListener('devicemotion', handleDeviceMotion);
            startButton.textContent = "Start Tracking";
            startButton.classList.remove('bg-red-500', 'hover:bg-red-600');
            startButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            
            statusMessage.textContent = `Tracking paused. Total steps: ${stepCount}.`;
            counterDisplay.classList.remove('running');
            isRunning = false;
        }
    }

    // Resets the step counter and display
    function resetCounter() {
        if (isRunning) {
            toggleCounting(false); // Stop tracking first
        }
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        stepCount = 0;
        durationSeconds = 0;
        lastStepTime = 0;
        stepsElement.textContent = 0;
        distanceElement.textContent = '0.00';
        durationElement.textContent = '00:00:00';
        statusMessage.textContent = "Counter reset. Press 'Start' to begin tracking.";
        console.log("Step counter reset.");
    }

    // Function to run on page load
    function initializeButtons() {
        startButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        startButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        startButton.textContent = "Start Tracking";
        statusMessage.textContent = "Press 'Start' to begin tracking.";
    }

    // Call the initializer
    document.addEventListener('DOMContentLoaded', initializeButtons);

    // Add a global error handler
    window.addEventListener('error', (e) => {
        console.error("An error occurred:", e.message);
    });

    // --- PWA Service Worker Registration -
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js', { scope: './' })
            .then(reg => {
                console.log('Service Worker registered! Scope:', reg.scope);
            })
            .catch(err => {
                console.warn('Service Worker registration failed:', err);
            });
        }
    }

    registerServiceWorker();

    // The clock update
    const dateTimeDisplay = document.getElementById('dateTimeDisplay');
    function updateDateTime() {
        
    }
    setInterval(updateDateTime, 1000);
    updateDateTime(); 

    // Main App Logic
    document.addEventListener('DOMContentLoaded', () => {
    
    // Find all DOM Elements
    const stepsElement = document.getElementById('steps');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const statusMessage = document.getElementById('statusMessage');
    const counterDisplay = document.getElementById('counterDisplay');
    const warningBox = document.getElementById('warningBox');
    const notSupportedBox = document.getElementById('notSupportedBox');
    const distanceElement = document.getElementById('distanceDisplay');
    const durationElement = document.getElementById('durationDisplay');

    // State Variables
    let stepCount = 0;
    let isRunning = false;
    let lastStepTime = 0;
    let lastZ = 0;
    let timerInterval = null;
    let durationSeconds = 0;

    // Sensor Constants
    const ACCELERATION_THRESHOLD = 1.25; 
    const STEP_DEBOUNCE_TIME = 200;
    const STEP_LENGTH_M = 0.76;

    // 

    function initializeButtons() {
        
    }

    initializeButtons(); // Call the initializer

    // Add a global error handler
    window.addEventListener('error', (e) => {
        console.error("An error occurred:", e.message);
    });


}); // Close of DOMContentLoaded listener