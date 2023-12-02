// Retrieve initial graded count and total count
let progressBarCaption = document.querySelector('.progressBar--caption.progressBar--caption-on-gray');
let [graded, total] = progressBarCaption.textContent.match(/\d+/g).map(Number);
let clickCount = graded;
let targetCount = total;

let lastClickTime = null;
let totalInterval = 0;
let isPaused = true; // Start as paused by default
let isOverlayHidden = false;
let overlay = document.createElement('div');
let statusSpan = document.createElement('span');
let blinkInterval;

// Setup overlay style
overlay.style.position = 'fixed';
overlay.style.top = '0';
overlay.style.left = '0';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
overlay.style.color = 'white';
overlay.style.padding = '10px';
overlay.style.fontSize = '14px';
overlay.style.zIndex = '1000';

// Add overlay to the page
document.body.appendChild(overlay);

// Pretty print time in milliseconds
function prettyPrintTime(ms) {
	let totalSeconds = Math.floor(ms / 1000);
	let hours = Math.floor(totalSeconds / 3600);
	let minutes = Math.floor((totalSeconds % 3600) / 60);
	let seconds = totalSeconds % 60;

	let result = '';
	if (hours > 0) {
		result += `${hours}h `;
	}
	if (hours > 0 || minutes > 0) {
		result += `${minutes}m `;
	}
	result += `${seconds}s`;

	return result;
}

// Calculate estimated completion time
function estimateCompletionTime(interval) {
	let now = new Date();
	now.setMilliseconds(now.getMilliseconds() + interval * (targetCount - clickCount));
	return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Blinking effect for paused status
function startBlinking() {
	if (!blinkInterval) {
		blinkInterval = setInterval(() => {
			statusSpan.style.visibility = statusSpan.style.visibility === 'hidden' ? 'visible' : 'hidden';
		}, 500);
	}
}

function stopBlinking() {
	if (blinkInterval) {
		clearInterval(blinkInterval);
		blinkInterval = null;
		statusSpan.style.visibility = 'visible';
	}
}

// Update overlay content
function updateOverlay() {
    let avgInterval = (clickCount > graded && !isPaused) ? (totalInterval / (clickCount - graded)) : 0;
    let timeLeft = (targetCount - clickCount) * avgInterval;

    // Clear existing content
    overlay.textContent = '';
    
    // Create text nodes for other content
    let textContent = document.createTextNode(`Graded: ${clickCount}/${targetCount}, Average Interval: ${prettyPrintTime(avgInterval)}, Estimated Time to Complete Grading: ${prettyPrintTime(timeLeft)}, Completion Time: ${estimateCompletionTime(avgInterval)}, Status: `);
    
    // Append text nodes and statusSpan
    overlay.appendChild(textContent);
    overlay.appendChild(statusSpan);
    statusSpan.textContent = isPaused ? 'Paused' : 'Active';

    if (isPaused) {
        startBlinking();
    } else {
        stopBlinking();
    }
}


// Toggle overlay visibility
function toggleOverlayVisibility() {
	isOverlayHidden = !isOverlayHidden;
	overlay.style.display = isOverlayHidden ? 'none' : 'block';
}

// Listen for key presses
document.addEventListener('keydown', function(event) {
	if (!isPaused && (event.key === 'z' || event.key === 'Z')) {
		clickCount++;
		let now = Date.now();

		if (lastClickTime !== null) {
			totalInterval += now - lastClickTime;
		}

		lastClickTime = now;
		updateOverlay();
	}

	// Toggle pause/resume with 'P' key
	if (event.key === 'p' || event.key === 'P') {
		isPaused = !isPaused;
		if (!isPaused) {
			lastClickTime = Date.now(); // Resume timing from current time
		}
		updateOverlay();
	}

	// Hide/Show overlay with 'H' key
	if (event.key === 'h' || event.key === 'H') {
		toggleOverlayVisibility();
	}
});

// Automatically pause when tab is not active
document.addEventListener('visibilitychange', function() {
	if (document.visibilityState === 'hidden') {
		isPaused = true;
		updateOverlay();
	}
});

// Initial overlay content
updateOverlay();