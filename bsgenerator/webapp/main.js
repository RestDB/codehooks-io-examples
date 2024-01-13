document.addEventListener('alpine:init', () => {
    Alpine.data('messageStore', () => ({
      message: 'Click the button to fetch a message ...',
      bsCount: 0,
      // init is called when document is ready
      init() {      
        this.getMessage()
      },
      // fetch json from the server public api
      async getMessage() {
        try {
          const response = await fetch('api/message', {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          // destruct json from server
          const { message, bsCount } = await response.json();
          // update local Alpine.data model
          this.message = message;
          this.bsCount = bsCount;
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }));
  });