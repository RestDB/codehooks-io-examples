/*
 * Post form to Codehooks server.
 */

function otpVerify(event) {
    event.preventDefault();
    // get email from URL hash
    const hash = window.location.hash.substring(1); // remove the # symbol
    const hashParams = new URLSearchParams(hash);
    const email = hashParams.get('email');   
    const data = {
        otp: document.getElementById('otp').value,
        email: email
    };
    
    fetch('/auth/otp/verify', {
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
            window.location.href = data.redirectURL;
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        document.getElementById('error-message').style.display = 'block';
    });
}


// Execute the function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("OTP: DOM fully loaded and parsed");
    // Your event listener code here
    document.getElementById('otp-form').addEventListener('submit', otpVerify);
});