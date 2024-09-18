let loggedIn = false;
let selectedStudentId = null;
let queue = [];

// Replace with your actual API key and spreadsheet ID
const API_KEY = 'AIzaSyBG7Rr4jOBesWwWM7a085HrPJD3tfdYJrM'; // Replace with your API Key
const SPREADSHEET_ID = '1mhf0bWTXhYH_qYD47kMv9RuJBXAV3ELrRetT-Ov-ZQc';
const RANGE = 'Sheet1!A2:H'; // Adjust the range according to your sheet (added column H)

// Fetch data from Google Sheets
async function fetchQueueData() {
    try {
        console.log('Fetching data from Google Sheets...');
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Data fetched:', data);
        const rows = data.values;

        queue = rows.map(row => ({
            queue_number: row[0],  // Column A
            name: row[1],         // Column B
            student_number: row[2], // Column C
            program: row[3],       // Column D
            year: row[4],          // Column E
            service: row[5],       // Column F
            sfa_number: row[6],    // Column G
            status: row[7] || ''   // Default to empty string if status is not provided (Column H)
        }));

        renderQueue();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Login function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'password') {
        loggedIn = true;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('sfa-page').style.display = 'block';
        fetchQueueData(); // Fetch queue data when logged in
    } else {
        alert('Invalid login');
    }
}

//Render Queue
function renderQueue() {
    const queueList = document.getElementById('queue-list');
    queueList.innerHTML = '';
    queue.forEach((student) => {
        const tr = document.createElement('tr');
        tr.id = `student-${student.queue_number}`;
        tr.className = student.status; // Apply the status class
        tr.setAttribute('onclick', `selectStudent(${student.queue_number})`);
        tr.innerHTML = `
            <td>${student.queue_number}</td>
            <td>${student.name}</td>
            <td>${student.student_number}</td>
            <td>${student.program}</td>
            <td>${student.year}</td>
            <td>${student.service}</td>
            <td>${student.sfa_number}</td>
        `;
        queueList.appendChild(tr);
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

// Update the status of a student in Google Sheets
async function updateStudentStatus(queue_number, status) {
    const index = queue.findIndex(item => item.queue_number === queue_number);
    if (index === -1) return;

    const range = `Sheet1!H${index + 2}`; // Assuming status is in column H and starts from row 2
    const valueRange = {
        range: range,
        majorDimension: 'ROWS',
        values: [[status]],
    };

    try {
        console.log(`Updating status for student ${queue_number} to ${status} in Google Sheets...`);
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`, {
            method: 'PUT',
            body: JSON.stringify(valueRange),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        console.log('Status updated successfully');
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Mark a student as servicing
async function servicing() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);
        if (student) {
            student.status = 'green'; // Mark as servicing
            console.log(`Updating status for student ${student.queue_number} to green`);
            renderQueue(); // Refresh the queue to apply the new status
            await updateStudentStatus(selectedStudentId, 'green'); // Update Google Sheets
        }
    } else {
        alert('Please select a student');
    }
}

// Mark a student as done
async function done() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);
        if (student) {
            student.status = 'red'; // Mark as done
            console.log(`Updating status for student ${student.queue_number} to red`);
            renderQueue(); // Refresh the queue to apply the new status
            await updateStudentStatus(selectedStudentId, 'red'); // Update Google Sheets
        }
    } else {
        alert('Please select a student');
    }
}


// Call out a student
function callOut() {
    if (selectedStudentId !== null) {
        const student = queue.find(item => item.queue_number === selectedStudentId);
        document.getElementById('callout-sound').play();
        alert(`Calling out: ${student.name}`);
    } else {
        alert('Please select a student');
    }
}

// Stop audio when it ends
document.getElementById('callout-sound').addEventListener('ended', function() {
    this.pause();
    this.currentTime = 0; // Reset the audio to the beginning
});
