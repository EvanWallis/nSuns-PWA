// Program Data
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

// Program State
let programState = {
    trainingMaxes: {
        bench: 0,
        row: 0,
        ohp: 0,
        lat: 0
    },
    prHistory: []
};

// DOM Elements
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

// Utility Functions
function roundToNearest5(num) {
    return Math.round(num / 5) * 5;
}

function showNotification(message) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Calculate new training max based on AMRAP performance
function calculateNewTM(currentTM, reps, percentage) {
    // nSuns formula - if AMRAP on 1+ set
    if (percentage === 0.95) {
        if (reps === 0) return currentTM - 10;
        if (reps === 1) return currentTM;
        if (reps === 2) return currentTM + 5;
        if (reps >= 3) return currentTM + 10;
    }
    // AMRAP on 5+ set
    else if (percentage === 0.65) {
        if (reps < 5) return currentTM - 5;
        if (reps >= 8) return currentTM + 5;
    }
    
    return currentTM; // No change if doesn't meet criteria
}

// Add PR to history
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

// Update PR history display
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

// Save program state to localStorage
function saveState() {
    localStorage.setItem('nsunsProgramState', JSON.stringify(programState));
}

// Load program state from localStorage
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

// Update Training Maxes
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

// Generate workout table rows for T1 exercises
function generateT1Rows(tableId, tm) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    programData.t1Percentages.forEach((set, index) => {
        const row = document.createElement('tr');
        const weight = roundToNearest5(tm * set.percentage);
        const isAmrap = typeof set.reps === 'string' && set.reps.includes('+');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${Math.round(set.percentage * 100)}%</td>
            <td>${weight}</td>
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
}

// Generate workout table rows for T2 exercises
function generateT2Rows(tableId, tm) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = '';
    
    programData.t2Percentages.forEach((set, index) => {
        const row = document.createElement('tr');
        const weight = roundToNearest5(tm * set.percentage);
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${Math.round(set.percentage * 100)}%</td>
            <td>${weight}</td>
            <td>${set.reps}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Update all workout tables
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
    
    // Day 5
    generateT1Rows('bench-t1-day5', programState.trainingMaxes.bench);
    generateT2Rows('cgbp-t2', programState.trainingMaxes.bench);
}

// Handle AMRAP set logging
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

// No day selection needed anymore - all days are shown
function setupProgram() {
    // Add some visual enhancements
    elements.dayContents.forEach(content => {
        content.classList.add('show-all');
    });
}

// Reset all data
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

// Event Listeners
function setupEventListeners() {
    elements.saveTmsBtn.addEventListener('click', updateTrainingMaxes);
    elements.resetAllBtn.addEventListener('click', resetAllData);
    
    // Check for online/offline status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// Check if user is online/offline
function updateOnlineStatus() {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'offline-indicator';
    offlineIndicator.id = 'offline-indicator';
    
    if (!navigator.onLine) {
        offlineIndicator.textContent = '📴 Offline Mode';
        offlineIndicator.classList.add('show');
        document.body.appendChild(offlineIndicator);
    } else {
        const existingIndicator = document.getElementById('offline-indicator');
        if (existingIndicator) {
            existingIndicator.classList.remove('show');
            setTimeout(() => {
                if (existingIndicator.parentNode) {
                    existingIndicator.parentNode.removeChild(existingIndicator);
                }
            }, 300);
        }
    }
}

// Initialize app
function init() {
    loadState();
    setupProgram();
    setupEventListeners();
    updateAllWorkouts();
    updateOnlineStatus(); // Check initial online status
    
    // Check if app was launched from home screen
    if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
        showNotification('App launched in standalone mode!');
    }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);