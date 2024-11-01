function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}

const project_name = localStorage.getItem('currentProjectName')

window.onload = function () {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('Task_overview').style.display = 'none';
    const name = localStorage.getItem('currentuserName')
    const logoutdiv = document.getElementById('logout')
    logoutdiv.innerHTML = 'You are loggend in as ' + name
    const userData = parseJwt(token);
    if (userData.role === 'Project Manager'){
        ProjectManagersection.style.display = 'block'
    }else {
         ProjectManagersection.style.display = 'none'
    }
    loadAssignmentsTable();
    
}
function addAssignment(){
    const assignDialog = document.getElementById("assignDialog");
    assignDialog.showModal();
    const projectName = localStorage.getItem('currentProjectName');
    fetchProjectWorkers(projectName, 'workerSelect');
}

function cancelAssignment(){
    const assignDialog = document.getElementById("assignDialog");
    assignDialog.close();
}

function fetchProjectWorkers(projectName, selectElementId) {
    fetch('/getProjectWorkers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_name: projectName }) 
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Failed to fetch project workers');
        }
    })
    .then(workers => {
        const selectElement = document.getElementById(selectElementId);
        
        
        selectElement.innerHTML = '';

        
        const placeholderOption = document.createElement('option');
        placeholderOption.text = 'Select a worker';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        selectElement.appendChild(placeholderOption);

        
        workers.forEach(worker => {
            const option = document.createElement('option');
            option.value = worker.name;
            option.textContent = worker.name;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching project workers:', error);
        alert('Failed to load project worker data.');
    });
}

function sendAssignment(){
    const project_name = localStorage.getItem('currentProjectName')
    const AssigntoWorker = document.getElementById('workerSelect').value

    const assignPrio = document.getElementById('priority').value
    const assignShorttext = document.getElementById('Assignment_shorttext').value
    const assignDescription = document.getElementById('Assigment_description').value
    const assignDeadline = document.getElementById('Assigment_deadline').value

        const newAssignment = {
        priority: assignPrio,
        shorttext: assignShorttext,
        description: assignDescription,
        deadline: assignDeadline,
        status: "Pending",
        comments: []
    };
    
    fetch('/assign-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            projectName: project_name,
            workerName: AssigntoWorker,
            assignment: newAssignment
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to assign task');
        }
        return response.json();
    })
    .then(data => {
        console.log('Assignment successfully added:', data);
    })
    .catch(error => {
        console.error('Error assigning task:', error);
    });
    
    assignDialog.close()
    
    
}

function loadAssignmentsTable() {
    const projectName = localStorage.getItem('currentProjectName'); 

    fetch('/get-project-assignments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch project assignments');
        }
        return response.json();
    })
    .then(project => {
        // Clear the existing table content (if any)
        const assignmentsContainer = document.getElementById('assignmentsContainer');
        assignmentsContainer.innerHTML = '';

        // Create the table
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');

        // Create header cells for each worker
        project.workers.forEach(worker => {
            const workerHeader = document.createElement('th');
            workerHeader.textContent = worker.name;
            headerRow.appendChild(workerHeader);
        });
        table.appendChild(headerRow);

        
        const maxAssignments = Math.max(...project.workers.map(worker => worker.assignments.length));

       
        for (let i = 0; i < maxAssignments; i++) {
            const row = document.createElement('tr');

            project.workers.forEach(worker => {
                const cell = document.createElement('td');

                // If the worker has an assignment at this index, display only the shorttext
                if (worker.assignments[i]) {
                    const assignment = worker.assignments[i];
                    cell.textContent = assignment.shorttext; 
                    
                    
                    cell.onclick = () => openDialog(assignment); 
                } else {
                    cell.textContent = ''; 
                }
                
                row.appendChild(cell);
            });

            table.appendChild(row);
        }

        assignmentsContainer.appendChild(table); 
    })
    .catch(error => {
        console.error('Error loading assignments:', error);
    });
}

function showAssignmentDetails(assignment) {
    const bodyDiv = document.querySelector('.body');
    console.log(assignment.shorttext)
    bodyDiv.innerHTML = `
        <h2>Assignment Details</h2>
        <p><strong>Prioirty </strong> ${assignment.priority}</p>
        <p><strong> Status </strong> ${assignment.status} <button onclick="set_status_wip('${assignment.shorttext}')"> Work on Project </button><p>
        <p><strong>Short Text:</strong> ${assignment.shorttext}</p>
        <p><strong>Description:</strong> ${assignment.description}</p>
        <p><strong>Deadline:</strong> ${assignment.deadline}</p> 
        <h3>Comment Section </h3>
                <ul id="commentList">
            ${assignment.comments.map(comment => `
                <li><strong>${comment.author}:</strong> ${comment.text}</li>
            `).join('')}
        </ul>
        <textarea id="newCommentText" placeholder="Add a comment"></textarea>
        <button onclick="addComment('${assignment.shorttext}')">Add Comment</button>
        
    `;
}

function set_status_wip(assignmentShorttext) {
    const strWIP = assignmentShorttext

    
    fetch('/update-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            assignmentShorttext: strWIP 
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update assignment status');
        }
        return response.json();
    })
    .then(data => {
        console.log('Assignment status successfully updated:', data);
        // Optionally, refresh the UI or display a success message
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
    
}

function addComment(assignmentShorttext) {
    const commentText = document.getElementById('newCommentText').value.trim(); // Trim whitespace
    const author = localStorage.getItem('currentuserName')
    
    // Check if the comment text and author are not empty
    if (!commentText || !author) {
        alert("Please provide a comment");
        return; // Exit the function if validation fails
    }

    // Sending the comment to the backend
    fetch('/add-comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            assignmentShorttext: assignmentShorttext,
            commentText: commentText,
            author: author
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add comment');
        }
        return response.json();
    })
    .then(data => {
        console.log('Comment successfully added:', data);
        // Optionally, clear the input fields after adding a comment
        document.getElementById('newCommentText').value = '';
        document.getElementById('commentAuthor').value = '';
    })
    .catch(error => {
        console.error('Error adding comment:', error);
    });
}

function loadWorkerAssignments() {
    const projectName = localStorage.getItem('currentProjectName'); // Get the current project name
    const workerName = localStorage.getItem('currentuserName'); // Get the logged-in worker's name

    fetch('/get-worker-assignments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectName, workerName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch worker assignments');
        }
        return response.json();
    })
    .then(assignments => {
        const taskList = document.getElementById('Workertasklist');
        
        // Clear existing tasks in the list
        taskList.innerHTML = '';

        // Populate the list with assignments
        assignments.forEach(assignment => {
            const listItem = document.createElement('li');
            listItem.classList.add('assignment-item');
            listItem.textContent = assignment.shorttext; // Display only the shorttext in the list

            // Add onclick event to show details in the `body` div
            listItem.onclick = () => showAssignmentDetails(assignment);

            taskList.appendChild(listItem);
        });
    })
    .catch(error => {
        console.error('Error loading worker assignments:', error);
    });
}



function openDialog(assignment) {
    // Set assignment details
    document.getElementById('dialogShorttext').textContent = assignment.shorttext;
    document.getElementById('dialogDescription').textContent = assignment.description;
    document.getElementById('dialogDeadline').textContent = assignment.deadline;

    // Populate comments
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = assignment.comments.map(comment => `
        <li><strong>${comment.author}:</strong> ${comment.text}</li>
    `).join('');

    // Show the dialog
    const dialog = document.getElementById('assignmentDialog');
    dialog.showModal();
}


function closeDialog() {
    const dialog = document.getElementById('assignmentDialog');
    dialog.close(); 
}

function ShowIndidivual(){
    document.getElementById('Project_overview').style.display = 'none';
    document.getElementById('Task_overview').style.display = 'block';
    loadWorkerAssignments();
    
    const Projectmanagermessage = document.getElementById('Projectmanagermessage');
    const token = localStorage.getItem('token');
    const userData = parseJwt(token);
    
    if (userData.role === 'Project Manager'){
        Projectmanagermessage.innerText = 'You are Project manager, you have no Tasks';
    }else if(userData.role === 'Admin'){
        Projectmanagermessage.innerText = 'As Admin you cannot have any tasks Assigned to you'
    }
    else{
        loadWorkerAssignments();
        Projectmanagermessage.style.display = 'none';
    }
    
    
}

function ShowProjectOverview(){
    document.getElementById('Project_overview').style.display = 'block';
    document.getElementById('Task_overview').style.display = 'none';
}
