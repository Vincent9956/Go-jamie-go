const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken'); 

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret'; 
const bcrypt = require('bcrypt');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});


app.post('/register', (req, res) => {
    const { email, username, password, role } = req.body;

    // Validate input: email, username, and password are required fields
    if (!email || !username || !password) {
        return res.status(400).send('Email, username, and password are required');
    }

    fs.readFile('user.json', 'utf8', (err, data) => {
        let users = [];
        
        if (!err && data) {
            users = JSON.parse(data); // Parse if there's content in the file
        }

        // Check if email or username already exists
        const emailExists = users.some(user => user.email === email);
        const usernameExists = users.some(user => user.username === username);

        if (emailExists) {
            return res.status(409).send('Email is already in use');
        }

        if (usernameExists) {
            return res.status(409).send('Username is already taken');
        }

        // Hash the password before storing
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).send('Internal Server Error');
            }

            // Prepare the new user data
            const newUser = {
                email: email,
                username: username,
                password: hashedPassword,
                role: role
            };

            // Add the new user to the list and save it to the JSON file
            users.push(newUser);

            fs.writeFile('user.json', JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                    return res.status(500).send('Internal Server Error');
                }
                console.log('User data saved successfully.');
                res.status(201).send('User registered successfully');
            });
        });
    });
});


app.post('/login', (req, res) => {
    const { loginusername, loginpassword } = req.body;

    // Read users from the JSON file
    fs.readFile('user.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Internal Server Error');
        
        const users = JSON.parse(data); 
        const user = users.find(u => u.username === loginusername);

        if (!user) {
            return res.status(401).send('Invalid credentials');
        }

        // Compare the hashed password with the login password
        bcrypt.compare(loginpassword, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (isMatch) {
                // Generate a JWT token if the password matches
                const token = jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
                res.json({ token }); 
            } else {
                res.status(401).send('Invalid credentials');
            }
        });
    });
});

app.get('/users', (req, res) => {
    fs.readFile('user.json', 'utf8', (err, data) => {
        if (err) {
            
            return res.status(500).send('Internal Server Error');
        }
        
        try {
            
            const users = JSON.parse(data);
            res.json(users); 
        } catch (parseErr) {
            
            return res.status(500).send('Error parsing user data');
        }
    });
});

app.post('/Projectcreate', (req, res) => {
    const projectData = {
        project_name: req.body.project_name,
        project_manager: req.body.project_manager,
        description: req.body.description,
        deadline: req.body.deadline,
        workers: req.body.workers
    };

    fs.readFile('Projects.json', 'utf8', (err, data) => {
        let projects = []; 
        if (!err && data) {
            projects = JSON.parse(data); 
        }

        projects.push(projectData); 

        
        fs.writeFile('Projects.json', JSON.stringify(projects, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Project data saved successfully.');
            res.status(201).send('Project created successfully');
        });
    });
});
app.post('/getUserProjects', (req, res) => {
    const { username } = req.body;

    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading Projects.json:', err);
            return res.status(500).send('Internal Server Error');
        }

        try {
            const projects = JSON.parse(data);
            
            // Find projects where the user is either the project manager or a worker
            const userProjects = projects.filter(project =>
                project.project_manager === username || 
                project.workers.some(workers => workers.name === username)
            );

            // Send only the project names back to the frontend
            const projectNames = userProjects.map(project => ({ project_name: project.project_name }));
            res.json(projectNames);
        } catch (parseErr) {
            console.error('Error parsing Projects.json:', parseErr);
            res.status(500).send('Internal Server Error');
        }
    });
});


// more or less useless, use if you want to display Deadline or sth
app.post('/getProjectDeadline', (req, res) => {
    const { project_name } = req.body;

    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }

        try {
            const projects = JSON.parse(data);
            const project = projects.find(p => p.project_name === project_name); 

            if (project) {
                res.json(project); 
            } else {
                res.status(404).send('Project not found');
            }
        } catch (parseErr) {
            return res.status(500).send('Error parsing project data');
        }
    });
});
app.post('/getProjectWorkers', (req, res) => {
    const { project_name } = req.body;
    
    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading project data');
        
        const projects = JSON.parse(data);
        const project = projects.find(p => p.project_name === project_name);
        
        if (project) {
            res.json(project.workers); 
        } else {
            res.status(404).send('Project not found');
        }
    });
});

app.post('/get-project-assignments', (req, res) => {
    const { projectName } = req.body;

    
    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading project file:', err);
            return res.status(500).json({ error: 'Error reading project data' });
        }

        let projects;
        try {
            projects = JSON.parse(data); 
        } catch (parseError) {
            console.error('Error parsing project data:', parseError);
            return res.status(500).json({ error: 'Error parsing project data' });
        }

        
        const project = projects.find(p => p.project_name === projectName);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        
        return res.json(project);
    });
});
app.post('/assign-task', (req, res) => {
    const { projectName, workerName, assignment } = req.body;

    // Read the current projects data
    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading project file:', err);
            return res.status(500).json({ error: 'Error reading project data' });
        }

        let projects;
        try {
            projects = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing project data:', parseError);
            return res.status(500).json({ error: 'Error parsing project data' });
        }

        // Find the specific project
        const project = projects.find(p => p.project_name === projectName);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Find the specified worker within the project
        const worker = project.workers.find(w => w.name === workerName);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found in this project' });
        }

        // Add the new assignment to the worker's assignments array
        worker.assignments.push(assignment);

        // Write updated data back to the fileno
        fs.writeFile('Projects.json', JSON.stringify(projects, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error updating project file:', writeErr);
                return res.status(500).json({ error: 'Failed to update project data' });
            }
            return res.json({ message: 'Assignment successfully added' });
        });
    });
});
app.post('/get-worker-assignments', (req, res) => {
    const { projectName, workerName } = req.body;

    // Read the projects data from the Projects.json file
    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading project file:', err);
            return res.status(500).json({ error: 'Error reading project data' });
        }

        let projects;
        try {
            projects = JSON.parse(data); // Parse the JSON file content
        } catch (parseError) {
            console.error('Error parsing project data:', parseError);
            return res.status(500).json({ error: 'Error parsing project data' });
        }

        // Find the requested project by its name
        const project = projects.find(p => p.project_name === projectName);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Find the worker within the project's workers
        const worker = project.workers.find(w => w.name === workerName);
        if (!worker) {
            return res.status(404).json({ error: 'Worker not found in this project' });
        }

        // Return the worker's assignments
        return res.json(worker.assignments);
    });
});
app.post('/update-status', (req, res) => {
    const { assignmentShorttext } = req.body; 

    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading project file:', err);
            return res.status(500).json({ error: 'Error reading project data' });
        }

        let projects;
        try {
            projects = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing project data:', parseError);
            return res.status(500).json({ error: 'Error parsing project data' });
        }

        // Find the assignment based on the shorttext
        let assignmentFound = false;
        projects.forEach(project => {
            project.workers.forEach(worker => {
                const assignment = worker.assignments.find(a => a.shorttext === assignmentShorttext);
                if (assignment) {
                    // Update the assignment status directly to "In Progress"
                    assignment.status = "In Progress";
                    assignmentFound = true;
                }
            });
        });

        if (!assignmentFound) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Write updated data back to the file
        fs.writeFile('Projects.json', JSON.stringify(projects, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error updating project file:', writeErr);
                return res.status(500).json({ error: 'Failed to update project data' });
            }
            return res.json({ message: 'Assignment status successfully updated' });
        });
    });
});
app.post('/add-comment', (req, res) => {
    const { assignmentShorttext, commentText, author } = req.body;

    // Read the current projects data
    fs.readFile('Projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading project file:', err);
            return res.status(500).json({ error: 'Error reading project data' });
        }

        let projects;
        try {
            projects = JSON.parse(data);
        } catch (parseError) {
            console.error('Error parsing project data:', parseError);
            return res.status(500).json({ error: 'Error parsing project data' });
        }

        // Find the assignment based on the shorttext
        let assignmentFound = false;
        projects.forEach(project => {
            project.workers.forEach(worker => {
                const assignment = worker.assignments.find(a => a.shorttext === assignmentShorttext);
                if (assignment) {
                    // If the assignment is found, add the new comment
                    if (!assignment.comments) {
                        assignment.comments = []; // Initialize comments array if it doesn't exist
                    }
                    // Create the comment object with text and author
                    const newComment = {
                        text: commentText,
                        author: author
                    };
                    assignment.comments.push(newComment); // Add the new comment object
                    assignmentFound = true;
                }
            });
        });

        if (!assignmentFound) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        // Write updated data back to the file
        fs.writeFile('Projects.json', JSON.stringify(projects, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error updating project file:', writeErr);
                return res.status(500).json({ error: 'Failed to update project data' });
            }
            return res.json({ message: 'Comment added successfully' });
        });
    });
});
app.get('/getAllProjects', (req, res) => {
    fs.readFile('projects.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading projects file:', err);
            return res.status(500).send('Internal Server Error');
        }

        const projects = JSON.parse(data);
        res.json(projects); // Send all projects as JSON
    });
});





app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
