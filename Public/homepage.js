const token = localStorage.getItem('token');
const userData = parseJwt(token);
const username = userData.username;
localStorage.setItem('currentuserName', username);

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
}


window.onload = function () {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }


    
    const adminSection = document.getElementById('adminSection');
    const projectManagerSection = document.getElementById('projectManagerSection');
    const workerSection = document.getElementById('workerSection');
    if (userData.role === 'Admin') {
        
        adminSection.style.display = 'block'; // Show admin section
    } else if (userData.role === 'Project Manager') {
        
        projectManagerSection.style.display = 'block'; // Show project manager section
    } else if (userData.role === 'Worker') {
        
        workerSection.style.display = 'block'; // Show worker section
    } 
    fetchUserProjects(username);
};

function fetchUserProjects(username) {
    fetch('/getUserProjects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username }) 
    })
    .then(response => response.json())
    .then(projects => {
        
        const userProjectsContainers = document.querySelectorAll('.userProjectsContainer');

        
        userProjectsContainers.forEach(userProjectsContainer => {
            
            userProjectsContainer.innerHTML = '';

            
            projects.forEach(project => {
                const projectDiv = document.createElement('div');
                projectDiv.classList.add('project-item');
            
                const projectLink = document.createElement('a');
                projectLink.href = 'project.html'; // No need for URL parameters
                projectLink.textContent = project.project_name;
            
                // Add click event to store the project name
                projectLink.addEventListener('click', () => {
                    localStorage.setItem('currentProjectName', project.project_name);
                });
            
                projectDiv.appendChild(projectLink);
                userProjectsContainer.appendChild(projectDiv);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching user projects:', error);
    });
}

function fillUserTable(users) {
    const userTableBody = document.getElementById('userTable').querySelector('tbody');
    userTableBody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr'); 
        
        // Username cell
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.username;
        row.appendChild(usernameCell);

        // Checkbox cell
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.setAttribute('data-id', user.id); // Store user ID
        checkbox.setAttribute('data-name', user.username); // Store user name
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

        userTableBody.appendChild(row);
    });
}

function getSelectedWorkerNames() {
    const checkboxes = document.querySelectorAll('#userTable tbody input[type="checkbox"]');
    const selectedWorkerNames = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedWorkerNames.push(checkbox.getAttribute('data-name')); // Get the user name from data-name attribute
        }
    });

    return selectedWorkerNames;
}
function createProject(){
    const adminDialog = document.getElementById("adminDialog");
    adminDialog.showModal();

    fetchUserName();

}
function continueProjectCreation() {

    const selectedWorkerNames = getSelectedWorkerNames();
    const Project_deadline = document.getElementById('project_deadline').value;
    const projectName = document.getElementById('project_name').value
    const projectDescription = document.getElementById('project_description').value
    const token = localStorage.getItem('token');
    const userData = parseJwt(token);
    const ProjectManager = userData.username

    const projectData = {
        
        project_name: projectName,
        project_manager: ProjectManager,
        description: projectDescription,
        deadline: Project_deadline,
        workers: selectedWorkerNames.map(workerName => ({
          name: workerName,
          assignments: []
        }))
      };

      fetch('/Projectcreate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify(projectData) 
    })
    .then(response => {
        if (response.ok) {
            
        } else {
            throw new Error('Creation failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Creation failed. Please try again.');
    });
    adminDialog.close();
    //fetchUserProjects(username);
  
}

function fetchUserName() {
    fetch('/users')
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch users');
            }
        })
        .then(users => {
            const workerUsernames = users.filter(user => user.role === 'Worker'); // Filter users by role
            fillUserTable(workerUsernames); // Fill the table with filtered users
            
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to load user data.');
        });
}

function cancelProjectCreation(){
    const adminDialog = document.getElementById("adminDialog");
    adminDialog.close();
}
function adminLoadall() {
    fetch('/getAllProjects', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(projects => {
        // Select all elements with class 'userProjectsContainer'
        const userProjectsContainers = document.querySelectorAll('.userProjectsContainer');

        // Loop through each container and display the projects
        userProjectsContainers.forEach(userProjectsContainer => {
            userProjectsContainer.innerHTML = ''; // Clear existing content

            projects.forEach(project => {
                const projectDiv = document.createElement('div');
                projectDiv.classList.add('project-item');

                const projectLink = document.createElement('a');
                projectLink.href = 'project.html'; // Link to the project page
                projectLink.textContent = project.project_name;

                // Add click event to store the project name in localStorage
                projectLink.addEventListener('click', () => {
                    localStorage.setItem('currentProjectName', project.project_name);
                });

                projectDiv.appendChild(projectLink);
                userProjectsContainer.appendChild(projectDiv);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching all projects:', error);
    });
}
