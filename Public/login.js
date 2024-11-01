document.getElementById('loginB').addEventListener('click', function (event) {
    event.preventDefault(); 

    
    const username = document.getElementById('loginusername').value;
    const password = document.getElementById('loginpassword').value;

    
    const loginData = {
        loginusername: username,
        loginpassword: password
    };

    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData) 
    })
    .then(response => {
        if (response.ok) {
            return response.json(); 
        } else {
            throw new Error('Login failed');
        }
    })
    .then(data => {
        
        if (data.token) {
            
            localStorage.setItem('token', data.token);
            
            window.location.href = '/'; //homepage
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Login failed. Please try again.');
    });
    
});
