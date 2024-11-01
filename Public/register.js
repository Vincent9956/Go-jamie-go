document.getElementById('registerB').addEventListener('click', function (event) {
    event.preventDefault(); 
    const email = document.getElementById('regemail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('role').value;    
    const userData = {
        email: email,
        username: username,
        password: password,
        role: role
    };
  
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', 
        },
        body: JSON.stringify(userData) 
    })
    .then(response => {
        if (response.ok) {
            // also needs token here because of successful registration -> eigentlich egal
            window.location.href = 'login.html';
        } else {
            throw new Error('Registration failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Registration failed. Please try again.');
    });
});
