import logo from './logo.svg';
import React from 'react';
import './App.css';

// React backend API endpoint and API token
const API_ENDPOINT = 'https://reactback-nyly.api.codehooks.io/dev/hello';
const API_KEY = 'a4679c85-b4c8-49fb-b8ac-63230b269dd7';

class App extends React.Component {
  // Application state
  constructor() {
    super();
    this.state = { message: "loading ...", visits: undefined };
  }

  async componentDidMount() {
    // call backend api at start
    const response = await fetch(API_ENDPOINT, {
      method: "GET",
      headers: { "x-apikey": API_KEY }
    })
    // get message and visits data from json response
    const {message, visits} = await response.json();
    // set app state and reload
    this.setState({ message, visits });
  }

  render() {
    const { message, visits } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>
            React backend with Codehooks.io
          </h2>
          <h2 className="heading">
            {message}
          </h2> 
          <p>
            Visitors: {visits}
          </p>          
        </header>
      </div>
    );
  }
}

export default App;
