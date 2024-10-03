let loggedIn = false;
let selectedStudentId = null;
let modifiedRows = {};
let queue = []

const API_KEY = 'AIzaSyBG7Rr4jOBesWwWM7a085HrPJD3tfdYJrM'; 
const SPREADSHEET_ID = '1mhf0bWTXhYH_qYD47kMv9RuJBXAV3ELrRetT-Ov-ZQc';
const RANGE = 'Sheet1!A2:J'; 

// Define users with associated SFA numbers
const users = {
    "user1": { password: "password1", sfa: "SFA-1" },
    "user2": { password: "password2", sfa: "SFA-2" },
    "user3": { password: "password3", sfa: "SFA-3" },
    "user4": { password: "password4", sfa: "SFA-4" },
    "user5": { password: "password5", sfa: "SFA-5" }
};

// Render the queue list
function renderQueue() {
    const queueBody = document.getElementById('queue-list');
    queueBody.innerHTML = ''; // Clear existing rows

    queue.forEach(student => {
        const row = document.createElement('tr');
        row.id = `student-${student.queue_number}`; // Set the row ID
        row.className = student.status; // Apply status class (green, red)
        row.innerHTML = `
            <td>${student.queue_number}</td>
            <td>${student.name}</td>
            <td>${student.student_number}</td>
            <td>${student.program}</td>
            <td>${student.year}</td>
            <td>${student.service}</td>
            <td>${student.sfa_number}</td>
        `;
        row.onclick = () => selectStudent(student.queue_number); // Attach click event for selection

        // Check if the current student is the selected one, and reapply the 'selected' class
        if (student.queue_number === selectedStudentId) {
            row.classList.add('selected');
        }

        queueBody.appendChild(row);
    });
}

// Select a student from the queue
function selectStudent(queue_number) {
    selectedStudentId = queue_number;
    console.log(`Selected student ID: ${selectedStudentId}`);

    // Remove "selected" class from all rows
    document.querySelectorAll('#queue-list tr').forEach(row => {
        row.classList.remove('selected');
    });

    // Add "selected" class to the clicked row
    const selectedRow = document.getElementById(`student-${queue_number}`);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
}

// Mark a student as servicing
function servicing() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);
        if (student) {
            student.status = 'green'; // Mark as servicing
            modifiedRows[student.queue_number] = 'green'; // Store this change
            renderQueue(); // Re-render queue with updated statuses
        }
    } else {
        alert('Please select a student');
    }
}

function done() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);
        if (student) {
            student.status = 'red'; // Mark as done
            modifiedRows[student.queue_number] = 'red'; // Store this change
            renderQueue(); // Re-render queue with updated statuses
        }
    } else {
        alert('Please select a student');
    }
}

// Fetch data from Google Sheets based on user-specific SFA number
async function fetchQueueData(userSFA) {
    try {
        console.log('Fetching data from Google Sheets for user...');
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`);
        
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const rows = data.values;

        // Map and filter based on user's SFA number
        queue = rows
            .map(row => ({
                queue_number: row[0], 
                name: row[3],
                student_number: row[4],
                program: row[5],
                year: row[6],
                service: row[7],
                sfa_number: row[8],
                status: modifiedRows[row[0]] || ''  // Preserve status (green or red) if it exists
            }))
            .filter(item => item.sfa_number === userSFA);

        renderQueue();  
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check if the username and password are correct
    if (users[username] && users[username].password === password) {
        loggedIn = true;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('sfa-page').style.display = 'block';

        // Fetch user-specific data based on SFA
        fetchQueueData(users[username].sfa); 

        // Set up auto-refresh every 5 seconds
        setInterval(() => {
            if (loggedIn) {
                fetchQueueData(users[username].sfa);
            }
        }, 5000); // 5000 milliseconds = 5 seconds    
        } 
        else {
        alert('Invalid username or password');
    }
}

// Call out a student
function callOut() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);

        if (student) {
            const queueNumber = student.queue_number.toString(); // Convert queue number to string
            const sfaNumber = student.sfa_number.replace('SFA-', ''); // Extract SFA number

            // Array to store the audio sequence
            const audioSequence = [
                `C:\\Users\\javie\\OneDrive\\Desktop\\Electronics_Design\\SFA_WebApp\\sounds\\student_with_number.mp3`,
                ...queueNumber.split('').map(digit => `C:\\Users\\javie\\OneDrive\\Desktop\\Electronics_Design\\SFA_WebApp\\sounds\\${digit}.mp3`), 
                `C:\\Users\\javie\\OneDrive\\Desktop\\Electronics_Design\\SFA_WebApp\\sounds\\sfa${sfaNumber}.mp3` 
            ];

            // Function to play audio files in sequence
            let audioIndex = 0;

            function playNextAudio() {
                if (audioIndex < audioSequence.length) {
                    const audio = new Audio(audioSequence[audioIndex]);
                    audio.play();
                    audio.onended = playNextAudio; // Play the next audio when this one ends
                    audioIndex++;
                }
            }

            // Start playing the audio sequence
            playNextAudio();

            alert(`Calling out: ${student.name}`); // Show the alert after playing audio
        }
    } else {
        alert('Please select a student');
    }
}


function playAudioSequence(files, index) {
    if (index < files.length) {
        const audio = new Audio(files[index]);
        audio.play();
        audio.addEventListener('ended', function() {
            playAudioSequence(files, index + 1); // Play the next audio file after the current one ends
        });
    }
}

// Stop audio when it ends
document.getElementById('callout-sound').addEventListener('ended', function() {
    this.pause();
    this.currentTime = 0; // Reset the audio to the beginning
});

// Logout function
function logout() {
    // Reset the login state
    loggedIn = false;
    selectedStudentId = null;
    queue = [];

    // Hide the SFA page and show the login page
    document.getElementById('sfa-page').style.display = 'none';
    document.getElementById('login-page').style.display = 'block';

    // Clear any intervals if you set them up for auto-refreshing
    clearInterval(); // Clear the auto-refresh interval if you set one

    alert('You have been logged out.');
}

// Add event listener for the logout button
document.getElementById('logout-button').addEventListener('click', logout);

