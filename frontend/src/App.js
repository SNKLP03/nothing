import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GameAnalysis from './GameAnalysis';
import ImportGames from './ImportGames';
import PredictMove from './PredictMove';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        {/* Dashboard route with nested routes */}
        <Route
          path="/dashboard"
          element={isLoggedIn ? <Dashboard username={username} /> : <Navigate to="/login" />}
        >
          <Route path="predict" element={<PredictMove />} />
          <Route path="import" element={<ImportGames username={username} />} /> {/* Pass username directly */}
          <Route index element={<div>Please select an option from the dashboard.</div>} />
        </Route>
        {/* Move GameAnalysis to a top-level route */}
        <Route
          path="/analysis/:analysisId"
          element={isLoggedIn ? <GameAnalysis username={username} /> : <Navigate to="/login" />}
        />
        <Route
          path="/analysis/new"
          element={isLoggedIn ? <GameAnalysis username={username} /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;