import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserInfo from './components/UserInfo';
import HomePage from './components/HomePage';
import Auth from './components/Auth';
import './App.css';

function App() {
  return (
    <Router>
      <Auth>
        <div className="app-container">
          <nav className="app-nav">
            <Link to="/">Home</Link> | 
            <Link to="/userinfo">User Info</Link> | 
            <a href="https://fortuitous-expanse-a616.codehooks.io/auth/signup">Sign Up</a> | 
            <a href="https://fortuitous-expanse-a616.codehooks.io/auth/login">Login</a>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/userinfo" element={<UserInfo />} />
          </Routes>
        </div>
      </Auth>
    </Router>    
  );
}

export default App;
