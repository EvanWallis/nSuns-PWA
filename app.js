/**
 * nSuns 5-Day Program - Workout Tracker App
 * This app allows users to track their lifts, with automated training max updates 
 * based on AMRAP (As Many Reps As Possible) sets
 */

// ==============================================
// PROGRAM DATA - Percentages for different lifts
// ==============================================
const programData = {
    // T1 percentages for main lifts
    t1Percentages: [
        { percentage: 0.75, reps: 5 },
        { percentage: 0.85, reps: 3 },
        { percentage: 0.95, reps: '1+' }, // AMRAP set
        { percentage: 0.90, reps: 3 },
        { percentage: 0.85, reps: 3 },
        { percentage: 0.80, reps: 3 },
        { percentage: 0.75, reps: 5 },
        { percentage: 0.70, reps: 5 },
        { percentage: 0.65, reps: '5+' }  // AMRAP set
    ],
    // Day 5 T1 bench press specific percentages
    day5BenchPercentages: [
        { percentage: 0.65, reps: 8 },
        { percentage: 0.75, reps: 6 },
        { percentage: 0.85, reps: 4 },
        { percentage: 0.85, reps: 4 },
        { percentage: 0.85, reps: 4 },
        { percentage: 0.80, reps: 5 },
        { percentage: 0.75, reps: 6 },
        { percentage: 0.70, reps: 7 },
        { percentage: 0.65, reps: '8+' }  // AMRAP set
    ],
    // T2 percentages for accessory lifts
    t2Percentages: [
        { percentage: 0.50, reps: 5 },
        { percentage: 0.60, reps: 5 },
        { percentage: 0.70, reps: 3 },
        { percentage: 0.70, reps: 3 },
        { percentage: 0.70, reps: 3 },
        { percentage: 0.70, reps: 3 },
        { percentage: 0.70, reps: 3 },
        { percentage: 0.70, reps: 3 }
    ]
};

// ==============================================
// PROGRAM STATE - User's training maxes and history
// ==============================================
let programState = {
    trainingMaxes: {
        bench: 0,
        row: 0,
        ohp: 0,
        lat: 0
    },
    prHistory: []
};

// Rest timer variables
let timerInterval = null;
let timeLeft = 0;

// ==============================================
// DOM ELEMENTS - References to HTML elements
// ==============================================
const elements = {
    tmInputs: {
        bench: document.getElementById('bench-tm'),
        row: document.getElementById('row-tm'),
        ohp: document.getElementById('ohp-tm'),
        lat: document.getElementById('lat-tm')
    },
    saveTmsBtn: document.getElementById('save-tms'),
    resetAllBtn: document.getElementById('reset-all'),
    dayContents: document.querySelectorAll('.day-content'),
    workoutTables: {
        benchT1: document.getElementById('bench-t1'),
        ohpT2: document.getElementById('ohp-t2'),
        rowT1: document.getElementById('row-t1'),
        ohpT1: document.getElementById('ohp-t1'),
        inclineT2: document.getElementById('incline-t2'),
        latT1: document.getElementById('lat-t1'),
        benchT1Day5: document.getElementById('bench-t1-day5'),
        cgbpT2: document.getElementById('cgbp-t2')
    },
    prHistory: document.getElementById('pr-history'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message')
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Rounds a number to the nearest 5
 * @param {number} num - Number to round
 * @return {number} Rounded number
 */
function roundToNearest5(num) {
    return Math.round(num / 5) * 5;
}

/**
 * Shows a notification message to the user
 * @param {string} message - Message to display
 */
function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

/**
 * Calculates new training max based on AMRAP performance
 * Only the 95% set (3rd set) can increase the training max now
 * @param {number} currentTM - Current training max
 * @param {number} reps - Reps performed on AMRAP set
 * @param {number} percentage - Percentage of TM for that set
 * @return {number} New training max
 */
function calculateNewTM(currentTM, reps, percentage) {
    console.log(`Calculating new TM: current=${currentTM}, reps=${reps}, percentage=${percentage}`);
    
    // Only the 95% (third set) can increase the training max
    if (percentage === 0.95) {
        if (reps === 0) return currentTM - 10;
        if (reps === 1) return currentTM;
        if (reps === 2) return currentTM + 5;
        if (reps >= 3) return currentTM + 10;
    } 
    // All other AMRAP sets (including Day 5 bench) can ONLY decrease TM if performance is poor
    else if (percentage === 0.65) {
        // Log for debugging
        console.log(`65% set detected - reps: ${reps} - should never increase TM`);
        
        // Only decrease, never increase
        if (reps < 5) return currentTM - 5;
        return currentTM; // Explicitly return the same TM no matter how many reps
    }
    
    // No change for all other cases
    return currentTM;
}

function addPRToHistory(lift, oldTM, newTM, reps, percentage) {
    const date = new Date();
    const formattedDate = date.toLocaleDateString();
    
    programState.prHistory.unshift({
        lift,
        date: formattedDate,
        oldTM,
        newTM,
        reps,
        percentage
    });
    
    // Limit history to 20 entries
    if (programState.prHistory.length > 20) {
        programState.prHistory.pop();
    }
    
    saveState();
    updatePRHistory();
}

/**
 * Updates the PR history display
 */
function updatePRHistory() {
    elements.prHistory.innerHTML = '';
    
    if (programState.prHistory.length === 0) {
        elements.prHistory.innerHTML = '<p>No PRs yet. Complete AMRAP sets to track progress.</p>';
        return;
    }
    
    programState.prHistory.forEach(pr => {
        const prEntry = document.createElement('div');
        prEntry.className = 'pr-entry';
        
        const change = pr.newTM - pr.oldTM;
        const changeText = change >= 0 ? `+${change}` : change;
        
        prEntry.innerHTML = `
            <p><strong>${pr.date}</strong>: ${pr.lift} - ${pr.reps} reps at ${Math.round(pr.percentage * 100)}%</p>
            <p>Training Max: ${pr.oldTM} → ${pr.newTM} (${changeText} lbs)</p>
        `;
        
        elements.prHistory.appendChild(prEntry);
    });
}

// ==============================================
// STATE MANAGEMENT - Save/load program state
// ==============================================

/**
 * Saves program state to localStorage
 */
function saveState() {
    localStorage.setItem('nsunsProgramState', JSON.stringify(programState));
}

/**
 * Loads program state from localStorage
 */
function loadState() {
    const savedState = localStorage.getItem('nsunsProgramState');
    if (savedState) {
        programState = JSON.parse(savedState);
        
        // Update input fields with saved values
        elements.tmInputs.bench.value = programState.trainingMaxes.bench;
        elements.tmInputs.row.value = programState.trainingMaxes.row;
        elements.tmInputs.ohp.value = programState.trainingMaxes.ohp;
        elements.tmInputs.lat.value = programState.trainingMaxes.lat;
        
        // Update all workouts with saved TMs
        updateAllWorkouts();
        updatePRHistory();
    } else {
        // First time user - show welcome notification
        setTimeout(() => {
            showNotification('Welcome! Set your training maxes to get started.');
        }, 500);
    }
}

/**
 * Updates the training maxes from input fields
 */
function updateTrainingMaxes() {
    programState.trainingMaxes = {
        bench: parseInt(elements.tmInputs.bench.value) || 0,
        row: parseInt(elements.tmInputs.row.value) || 0,
        ohp: parseInt(elements.tmInputs.ohp.value) || 0,
        lat: parseInt(elements.tmInputs.lat.value) || 0
    };
    
    saveState();
    updateAllWorkouts();
    showNotification('Training maxes updated successfully!');
}

// ==============================================
// WORKOUT GENERATION - Build workout tables
// ==============================================

/**
 * Generates workout table rows for T1 exercises
 * @param {string} tableId - ID of table to populate
 * @param {number} tm - Training max to use
 * @param {boolean} useDay5Format - Whether to use Day 5 bench format
 */
function generateT1Rows(tableId, tm, useDay5Format = false) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    // Use Day 5 bench format if specified
    const percentages = useDay5Format ? programData.day5BenchPercentages : programData.t1Percentages;
    
    percentages.forEach((set, index) => {
        const row = document.createElement('tr');
        const weight = roundToNearest5(tm * set.percentage);
        const isAmrap = typeof set.reps === 'string' && set.reps.includes('+');
        
        // Add class for AMRAP sets
        if (isAmrap) {
            row.classList.add('amrap-set');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${Math.round(set.percentage * 100)}%</td>
            <td class="weight-cell" data-weight="${weight}">${weight}</td>
            <td>${set.reps}</td>
            <td>
                ${isAmrap ? `
                    <input type="number" class="amrap-input" min="0" placeholder="Reps">
                    <button class="amrap-btn" 
                        data-lift="${tableId.includes('bench') ? 'bench' : tableId.includes('row') ? 'row' : tableId.includes('ohp') ? 'ohp' : 'lat'}"
                        data-percentage="${set.percentage}"
                        data-set-index="${index}">Log</button>
                ` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add event listeners to AMRAP buttons
    const amrapBtns = tbody.querySelectorAll('.amrap-btn');
    amrapBtns.forEach(btn => {
        btn.addEventListener('click', handleAmrapLog);
    });
    
    // Add plate calculator functionality to weights
    const weightCells = tbody.querySelectorAll('.weight-cell');
    weightCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const weight = parseFloat(this.dataset.weight);
            if (!isNaN(weight)) {
                showPlateCalculation(weight);
            }
        });
    });
}

/**
 * Generates workout table rows for T2 exercises
 * @param {string} tableId - ID of table to populate
 * @param {number} tm - Training max to use
 */
function generateT2Rows(tableId, tm) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    programData.t2Percentages.forEach((set, index) => {
        const row = document.createElement('tr');
        const weight = roundToNearest5(tm * set.percentage);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${Math.round(set.percentage * 100)}%</td>
            <td class="weight-cell" data-weight="${weight}">${weight}</td>
            <td>${set.reps}</td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add plate calculator functionality to weights
    const weightCells = tbody.querySelectorAll('.weight-cell');
    weightCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const weight = parseFloat(this.dataset.weight);
            if (!isNaN(weight)) {
                showPlateCalculation(weight);
            }
        });
    });
}

/**
 * Update all workout tables with current training maxes
 */
function updateAllWorkouts() {
    // Day 1
    generateT1Rows('bench-t1', programState.trainingMaxes.bench);
    generateT2Rows('ohp-t2', programState.trainingMaxes.ohp);
    
    // Day 2
    generateT1Rows('row-t1', programState.trainingMaxes.row);
    
    // Day 3
    generateT1Rows('ohp-t1', programState.trainingMaxes.ohp);
    generateT2Rows('incline-t2', programState.trainingMaxes.bench);
    
    // Day 4
    generateT1Rows('lat-t1', programState.trainingMaxes.lat);
    
    // Day 5 - Use special Day 5 bench format
    generateT1Rows('bench-t1-day5', programState.trainingMaxes.bench, true);
    generateT2Rows('cgbp-t2', programState.trainingMaxes.bench);
}

// ==============================================
// EVENT HANDLERS - For user interactions
// ==============================================

/**
 * Handles AMRAP set logging
 * @param {Event} e - Click event
 */
function handleAmrapLog(e) {
    const btn = e.target;
    const inputField = btn.previousElementSibling;
    const reps = parseInt(inputField.value);
    
    if (isNaN(reps)) {
        showNotification('Please enter a valid number of reps.');
        return;
    }
    
    const lift = btn.dataset.lift;
    const percentage = parseFloat(btn.dataset.percentage);
    const oldTM = programState.trainingMaxes[lift];
    const newTM = calculateNewTM(oldTM, reps, percentage);
    
    // Update training max if changed
    if (newTM !== oldTM) {
        programState.trainingMaxes[lift] = newTM;
        elements.tmInputs[lift].value = newTM;
        saveState();
        updateAllWorkouts();
        
        // Add to PR history
        addPRToHistory(
            lift.charAt(0).toUpperCase() + lift.slice(1), // Capitalize first letter
            oldTM,
            newTM,
            reps,
            percentage
        );
        
        const change = newTM - oldTM;
        const changeText = change > 0 ? `increased by ${change}` : `decreased by ${Math.abs(change)}`;
        showNotification(`${lift.charAt(0).toUpperCase() + lift.slice(1)} training max ${changeText} lbs!`);
        
        // Add celebration animation to the workout section
        const section = btn.closest('.workout-section');
        section.classList.add('celebrate');
        setTimeout(() => {
            section.classList.remove('celebrate');
        }, 1000);
    } else {
        showNotification(`No change to ${lift} training max.`);
    }
    
    // Clear input field
    inputField.value = '';
    
    // Add haptic feedback if available (iOS)
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
    }
}

/**
 * Calculate plate configuration for a given weight
 * @param {number} weight - Weight to calculate plates for
 * @return {Object} Configuration of plates needed
 */
function calculatePlates(weight) {
    // Assuming 45lb bar
    const barWeight = 45;
    let remainingWeight = weight - barWeight;
    
    // Available plate weights (in lbs)
    const plates = [45, 35, 25, 10, 5, 2.5];
    const result = {};
    
    // Skip calculation if weight is less than bar
    if (remainingWeight <= 0) {
        return { error: "Weight is less than or equal to bar weight" };
    }
    
    // Calculate plates needed on each side
    for (const plate of plates) {
        // How many of this plate can we fit? (divide by 2 because we need pairs)
        const count = Math.floor(remainingWeight / (plate * 2));
        if (count > 0) {
            result[plate] = count;
            remainingWeight -= count * plate * 2;
        }
    }
    
    // Check if we couldn't get to exact weight
    if (remainingWeight > 0) {
        // If we're off by less than 1lb, it's probably a rounding issue
        if (remainingWeight < 1) {
            return result;
        }
        return { error: "Cannot make exact weight with available plates" };
    }
    
    return result;
}

/**
 * Shows plate calculation in a notification
 * @param {number} weight - Weight to calculate plates for
 */
function showPlateCalculation(weight) {
    const plates = calculatePlates(weight);
    
    if (plates.error) {
        showNotification(plates.error);
        return;
    }
    
    let plateText = "Plates per side: ";
    let hasPlates = false;
    
    // Format the plate text
    for (const [plate, count] of Object.entries(plates)) {
        if (count > 0) {
            plateText += `${count}×${plate}lb, `;
            hasPlates = true;
        }
    }
    
    // Remove trailing comma and space
    if (hasPlates) {
        plateText = plateText.slice(0, -2);
    } else {
        plateText += "Just the bar";
    }
    
    showNotification(plateText);
}

// ==============================================
// PROGRAM SETUP - Initialize app features
// ==============================================

/**
 * Sets up program features
 */
function setupProgram() {
    // Add rest timer button
    const timerButton = document.createElement('button');
    timerButton.id = 'timer-toggle';
    timerButton.textContent = '⏱️ Rest Timer';
    timerButton.style.margin = '20px 0';
    
    // Create timer element
    const timerElement = document.createElement('div');
    timerElement.id = 'rest-timer';
    timerElement.className = 'rest-timer';
    timerElement.innerHTML = `
        <div class="timer-display" id="timer-display">00:00</div>
        <div class="timer-controls">
            <button id="timer-60">60s</button>
            <button id="timer-90">90s</button>
            <button id="timer-120">120s</button>
            <button id="timer-stop" class="danger-btn">Stop</button>
        </div>
    `;
    timerElement.style.display = 'none'; // Hidden by default
    
    // Add elements to the page
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(timerButton, document.querySelector('.days-container'));
    document.body.appendChild(timerElement);
    
    // Add event listeners
    timerButton.addEventListener('click', () => {
        if (timerElement.style.display === 'none') {
            timerElement.style.display = 'block';
        } else {
            timerElement.style.display = 'none';
        }
    });
    
    document.getElementById('timer-60').addEventListener('click', () => startTimer(60));
    document.getElementById('timer-90').addEventListener('click', () => startTimer(90));
    document.getElementById('timer-120').addEventListener('click', () => startTimer(120));
    document.getElementById('timer-stop').addEventListener('click', stopTimer);
}

// ==============================================
// REST TIMER FUNCTIONS
// ==============================================

/**
 * Starts the rest timer
 * @param {number} seconds - Number of seconds to count down
 */
function startTimer(seconds) {
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timeLeft = seconds;
    updateTimerDisplay();
    
    // Make timer visible
    document.getElementById('rest-timer').style.display = 'block';
    
    // Add vibration feedback if available
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(100);
    }
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            stopTimer(true);
        }
    }, 1000);
}

/**
 * Stops the rest timer
 * @param {boolean} completed - Whether timer completed naturally
 */
function stopTimer(completed = false) {
    clearInterval(timerInterval);
    timerInterval = null;
    
    // Hide the timer element
    document.getElementById('rest-timer').style.display = 'none';
    
    if (completed) {
        // Vibration feedback if available
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 100, 100]);
        }
        
        showNotification('Rest complete! Ready for your next set.');
    }
}

/**
 * Updates the timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Resets all app data
 */
function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This will erase all your training maxes and PR history.')) {
        // Reset program state
        programState = {
            trainingMaxes: {
                bench: 0,
                row: 0,
                ohp: 0,
                lat: 0
            },
            prHistory: []
        };
        
        // Reset input fields
        elements.tmInputs.bench.value = '';
        elements.tmInputs.row.value = '';
        elements.tmInputs.ohp.value = '';
        elements.tmInputs.lat.value = '';
        
        // Update UI
        saveState();
        updateAllWorkouts();
        updatePRHistory();
        
        showNotification('All data has been reset successfully!');
    }
}

// ==============================================
// DAY SELECTION - For navigating workout days
// ==============================================

/**
 * Sets up the day selection buttons
 */
function setupDaySelection() {
    const dayButtons = document.querySelectorAll('.day-selection button');
    dayButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const day = parseInt(btn.dataset.day);
            showDay(day);
        });
    });
    
    // Show Day 1 by default
    showDay(1);
}

/**
 * Shows a specific workout day and hides others
 * @param {number} day - Day number to show (1-5)
 */
function showDay(day) {
    // Hide all days and deselect all buttons
    elements.dayContents.forEach(content => {
        content.classList.remove('active');
    });
    
    const dayButtons = document.querySelectorAll('.day-selection button');
    dayButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected day and activate its button
    const selectedDay = document.getElementById(`day-${day}`);
    const selectedButton = document.querySelector(`.day-selection button[data-day="${day}"]`);
    
    if (selectedDay) {
        selectedDay.classList.add('active');
    }
    
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

/**
 * Sets up event listeners
 */
function setupEventListeners() {
    elements.saveTmsBtn.addEventListener('click', updateTrainingMaxes);
    elements.resetAllBtn.addEventListener('click', resetAllData);
    
    // Check for online/offline status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

/**
 * Updates the online/offline status indicator
 */
function updateOnlineStatus() {
    // Remove any existing indicator
    const existingIndicator = document.getElementById('offline-indicator');
    if (existingIndicator) {
        existingIndicator.parentNode.removeChild(existingIndicator);
    }
    
    // Only show indicator if offline
    if (!navigator.onLine) {
        const offlineIndicator = document.createElement('div');
        offlineIndicator.className = 'offline-indicator';
        offlineIndicator.id = 'offline-indicator';
        offlineIndicator.textContent = '📴 Offline Mode';
        offlineIndicator.classList.add('show');
        document.body.appendChild(offlineIndicator);
    }
}

// ==============================================
// INITIALIZATION - Start the app
// ==============================================

/**
 * Initializes the app
 */
function init() {
    loadState();
    setupProgram();
    setupDaySelection(); // This is critical for day selection to work
    setupEventListeners();
    updateAllWorkouts();
    updateOnlineStatus();
    
    // Remove "Mark Day Complete" functionality
    const markCompleteBtns = document.querySelectorAll('.mark-complete-btn');
    markCompleteBtns.forEach(btn => {
        if (btn.parentNode) {
            btn.parentNode.removeChild(btn);
        }
    });
    
    const badges = document.querySelectorAll('.completion-badge');
    badges.forEach(badge => {
        badge.style.display = 'none';
    });
    
    // Check if app was launched from home screen
    if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
        showNotification('App launched in standalone mode!');
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);