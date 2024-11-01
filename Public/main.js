function logout() {
    localStorage.removeItem('token');
    alert('You have been logged out successfully.');

    
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, null, window.location.href);
    };

    window.location.href = '/login.html'; 
}
function backtohomepage(){
    window.location.href = 'homepage.html'
}

