// replace with your own api token
let listenerID = null;

document.addEventListener('DOMContentLoaded', function () {
    const aliasInput = document.getElementById('aliasInput');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Function to send a message to the server
    function sendMessage(message) {
        fetch('/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message, listenerID, alias: aliasInput.value.trim() }),
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

    sendButton.addEventListener('click', function () {
        if (messageInput.value) {
            sendMessage(messageInput.value);
        }
    });

    messageInput.addEventListener('keydown', function (event) {
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
    messagesDiv.appendChild(messageElement); // Adds the message at the bottom    
    // Auto-scroll to the bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// connect to realtime SSE
async function startListener() {
    // setup the real time stuff
    const statusIndicator = document.getElementById('statusIndicator');

    const interests = {}; // everything
    var requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
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
    let eventSource = new EventSourcePolyfill(`/chat/${result.listenerID}`);
    statusIndicator.textContent = 'Connected';
    statusIndicator.style.color = 'green';

    // incoming message event
    eventSource.onmessage = function (event) {
        console.log("Event", event.data)
        const result = JSON.parse(event.data);
        addMessage(result.message)
    };

    // here we go
    eventSource.onopen = function (event) {
        // Connection is open
        statusIndicator.textContent = 'Live data ready';
        statusIndicator.style.color = 'green';
    };
    // oops, should we reconnect
    eventSource.onerror = function (event) {
        console.log("Error", event);
        // An error occurred or the connection was closed
        if (eventSource.readyState == EventSource.CLOSED) {
            console.log("Connection was closed.");
        }
        statusIndicator.textContent = 'No connection';
        statusIndicator.style.color = 'red';
    };

    return result;
}
