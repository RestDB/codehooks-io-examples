import logo from './logo.svg';
import React from 'react';
import './App.css';
import { API_KEY } from './config'

class App extends React.Component {
  // Application state
  state = { quote: 'Famous quotes on the way ...', author: 'Unknown author' };

  componentDidMount() {
    // serve new quotes automatically each 10 sec
    this.interval = setInterval(this.fetchQuote, 10000);

    // server one at start
    this.fetchQuote();
  }
  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchQuote = () => {
    console.log("Get quote")
    fetch("https://quotes-q04p.api.codehooks.io/dev/quote", {
      method: "GET",
      headers: { "x-apikey": API_KEY }
    })
      .then((response) => response.json())
      .then((json) => {
        const { quote, author } = json;
        this.setState({ quote, author });
      })

      .catch((error) => {
        console.log(error);
      })
  }

  render() {
    const { advice } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>
            React and Codehooks.io quotes
          </h2>
          <div className="card">
            <h4 className="heading">{this.state.quote}</h4>
            <p className="author">{this.state.author}</p>
          </div>
        </header>
      </div>
    );
  }
}

export default App;
