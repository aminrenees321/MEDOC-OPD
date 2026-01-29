import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Doctors from './pages/Doctors';
import Slots from './pages/Slots';
import Tokens from './pages/Tokens';
import Simulation from './pages/Simulation';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <h1 className="navbar-brand">🏥 OPD Token Allocation Engine</h1>
            <ul className="navbar-nav">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/doctors">Doctors</Link></li>
              <li><Link to="/slots">Slots</Link></li>
              <li><Link to="/tokens">Tokens</Link></li>
              <li><Link to="/simulation">Simulation</Link></li>
            </ul>
          </div>
        </nav>
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/slots" element={<Slots />} />
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/simulation" element={<Simulation />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
