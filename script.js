document.addEventListener('DOMContentLoaded', function() {
    var correctPassword = 'jyoshnavi@IT'; // Set the correct password here
    var loginForm = document.getElementById('login-form');
    var passwordInput = document.getElementById('password');
    var errorMessage = document.getElementById('error-message');
    var contentContainer = document.getElementById('content-container');
    var loginContainer = document.getElementById('login-container');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        var enteredPassword = passwordInput.value;

        if (enteredPassword === correctPassword) {
            loginContainer.style.display = 'none';
            contentContainer.style.display = 'block';
        } else {
            errorMessage.textContent = 'Incorrect password. Please try again.';
        }
    });
});
