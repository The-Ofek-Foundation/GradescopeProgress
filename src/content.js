const progressBarCaption = document.querySelector('.progressBar--caption.progressBar--caption-on-gray');
const getGradedTotal = () => progressBarCaption.textContent.match(/\d+/g).map(Number);

let [graded, total] = getGradedTotal();
const timePerSubmission = [];

const createOverlay = () => {
	const overlay = document.createElement('div');

	overlay.style.position = 'fixed';
	overlay.style.top = '0';
	overlay.style.left = '0';
	overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
	overlay.style.color = 'white';
	overlay.style.padding = '10px';
	overlay.style.fontSize = '14px';
	overlay.style.zIndex = '1000';
	overlay.title = 'Press H to hide/show overlay, and press Pause/Grading to toggle pausing/unpausing';
	
	return overlay;
};

let lastClickTime = null;
let isPaused = true; // Start as paused by default
let isOverlayHidden = false;
const overlay = createOverlay();
let statusSpan = document.createElement('span');
let blinkInterval;

document.body.appendChild(overlay);

const prettyPrintTime = (ms) => {
	if (ms === '?') return '?';

	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	let result = '';
	if (hours > 0) result += `${hours}h `;
	if (hours > 0 || minutes > 0) result += `${minutes}m `;
	result += `${seconds}s`;

	return result;
}

const prettyPrintEstimatedTimeLeft = (estimatedTimeLeft, marginOfError) => {
	if (estimatedTimeLeft === '?' || estimatedTimeLeft === 0) return estimatedTimeLeft;
	
	return `${prettyPrintTime(estimatedTimeLeft)} ± ${prettyPrintTime(marginOfError)}`;
}

const prettyPrintCompletionTime = (estimatedTimeLeft, marginOfError) => {
	if (estimatedTimeLeft === '?') return '?';
	if (estimatedTimeLeft === 0) return 'N/A';
	
	const now = new Date();
	const estimatedDate = new Date();
	const estimatedCompletionTimeMs = estimatedDate.getMilliseconds() + estimatedTimeLeft;
	estimatedDate.setMilliseconds(estimatedCompletionTimeMs);
	const time = estimatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	
	if (marginOfError === '?')
		return `${time} ± ?`;

	// Calculate the lower and upper bounds of the completion time
	let lowerBound = new Date();
	lowerBound.setMilliseconds(estimatedCompletionTimeMs - marginOfError);
	lowerBound = lowerBound < now ? now : lowerBound;
	const lowerBoundTime = lowerBound.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	const upperBound = new Date();
	upperBound.setMilliseconds(estimatedCompletionTimeMs + marginOfError);
	const upperBoundTime = upperBound.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	if (lowerBound == upperBound)
		return `~${time}`;

	return `${lowerBoundTime} - ${upperBoundTime}`;
}

const startBlinking = () => {
	if (blinkInterval) return;

	blinkInterval = setInterval(() => {
		statusSpan.style.opacity = statusSpan.style.opacity === '0' ? '1' : '0';
	}, 500);
}

const stopBlinking = () => {
	if (!blinkInterval) return;

	clearInterval(blinkInterval);
	blinkInterval = null;
	statusSpan.style.opacity = '1';
}

const updateOverlay = () => {
	const averageTime = calculateMean(timePerSubmission) || '?';
	const [estimatedTimeLeft, marginOfError] = extrapolateMeanAndError(timePerSubmission, total - graded);

	overlay.textContent = '';
	
	const textContent = document.createTextNode(`Graded: ${graded}/${total}, ${prettyPrintTime(averageTime)}/submission, Estimated Time to Complete Grading: ${prettyPrintEstimatedTimeLeft(estimatedTimeLeft, marginOfError)}, Completion Time: ${prettyPrintCompletionTime(estimatedTimeLeft, marginOfError)}, Status: `);
	
	overlay.appendChild(textContent);
	overlay.appendChild(statusSpan);
	statusSpan.textContent = isPaused ? 'Paused' : 'Grading';

	if (isPaused) startBlinking();
	else stopBlinking();
}

const onGraded = () => {
	const [newGraded, newTotal] = getGradedTotal();
	const timeTaken = Date.now() - lastClickTime;
	lastClickTime = Date.now();

	if (newGraded !== graded) {
		if (!isPaused && newGraded > graded)
			timePerSubmission.push(timeTaken);
	
		[graded, total] = [newGraded, newTotal];
	}

	updateOverlay();
}

const toggleOverlayVisibility = () => {
	isOverlayHidden = !isOverlayHidden;
	overlay.style.display = isOverlayHidden ? 'none' : 'block';
}

const togglePause = () => {
	isPaused = !isPaused;
	lastClickTime = Date.now();
	updateOverlay();
}

document.addEventListener('keydown', (event) => {
	if (event.key === 'h' || event.key === 'H')
		toggleOverlayVisibility();
});

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'hidden') {
		isPaused = true;
		updateOverlay();
	}
});

window.onblur = () => {
	isPaused = true;
	updateOverlay();
}

statusSpan.addEventListener('click', togglePause);
statusSpan.style.cursor = 'pointer';

const observer = new MutationObserver(onGraded);
observer.observe(progressBarCaption, { childList: true, characterData: true, subtree: true });

updateOverlay();