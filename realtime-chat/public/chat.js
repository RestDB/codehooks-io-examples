const API_TOKEN = '0a2249d4-5f10-489c-8229-1f060ad1e0f6';
let listenerID = null;

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');    

    // Function to send a message to the server
    function sendMessage(message) {
        fetch('/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': API_TOKEN
            },
            body: JSON.stringify({ message: message, listenerID }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Message sent:', data);
            messageInput.value = ''; // Clear input after sending
            messageInput.focus(); // Keep focus on input field
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    sendButton.addEventListener('click', function() {
        if (messageInput.value) {
            sendMessage(messageInput.value);
        }
    });

    messageInput.addEventListener('keydown', function(event) {
        // Check if Enter key is pressed without Shift key
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default to avoid line breaks or form submission
            if (messageInput.value) {
                sendMessage(messageInput.value);
            }
        }
    });  
    // init real-time connection
    startListener();
});

function addMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    // If there's already a child, insert before the first child to add to the top
    if (messagesDiv.firstChild) {
        messagesDiv.insertBefore(messageElement, messagesDiv.firstChild);
    } else {
        // If no messages are present, appendChild will still add it to the top
        messagesDiv.appendChild(messageElement);
    }
    // Auto-scroll to the top
    messagesDiv.scrollTop = 0;
}


// connect to realtime SSE
async function startListener() {
    // setup the real time stuff
    const sseStatus = document.getElementById('sseStatus');    
    const interests = {}; // everything or nothing
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-apikey': API_TOKEN
        },
        body: JSON.stringify(interests)
    };
    // get a real time listenerID
    console.log('Connect request', requestOptions)
    const response = await fetch('/connect', requestOptions);
    const result = await response.json();
    listenerID = result.listenerID;
    console.log('GOT clientID', result)
    
    // connect to reatime channel
    let eventSource = new EventSourcePolyfill(`/chat/${result.listenerID}`, {
        headers: {
            'x-apikey': API_TOKEN
        }
    });
    sseStatus.style.backgroundColor = 'green';

    // incoming message event
    eventSource.onmessage = function (event) {
        console.log("Event", event.data)
        const result = JSON.parse(event.data); 
        addMessage(result.message)               
    };
    
    // here we go
    eventSource.onopen = function(event) {
        // Connection is open
        console.log('Open event', event)
        sseStatus.style.backgroundColor = 'green';
    };
    // oops, should we reconnect
    eventSource.onerror = function(event) {
        console.log("Error", event);
        // An error occurred or the connection was closed
        if (eventSource.readyState == EventSource.CLOSED) {
            console.log("Connection was closed.");            
        }
        sseStatus.style.backgroundColor = 'red';        
    };

    return result;
}