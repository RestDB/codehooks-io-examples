/*
 * Post form to Codehooks server.
 */
function passwordSignIn(event) {
    event.preventDefault();
    
    const data = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };
    
    fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            document.getElementById('error-message').style.display = 'block';
        } else {
            document.getElementById('error-message').style.display = 'none';                    
        }
        if (response.redirected) {
            return window.location.href = response.url;
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            console.error('Error login:', data);                        
        } else {
            console.log('Login data', data)
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('error-message').style.display = 'block';
    });
}

function otpSignIn(event) {
    event.preventDefault();
    
    const data = {
        username: document.getElementById('username').value        
    };
    
    fetch('/auth/otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to verify OTP user');
        } else {
            document.getElementById('error-message').style.display = 'none';                    
        }
        if (response.redirected) {
            return window.location.href = response.url;
        }
        return response.json();
    })
    .then(data => {
        if (data.error) {
            console.error('Error login:', data);                        
        } else {
            console.log('Login data', data)
            window.location.href = `otp#email=${data.email}`;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('error-message').style.display = 'block';
    });
}


// Execute the function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("Password: DOM fully loaded and parsed");
    // Your event listener code here
    document.getElementById('login-form').addEventListener('submit', otpSignIn);
});