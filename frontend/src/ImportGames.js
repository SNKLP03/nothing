import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, List, ListItemButton, ListItemText } from '@mui/material';

function ImportGames({ username }) {
  const [chessUsername, setChessUsername] = useState('');
  const [games, setGames] = useState([]);
  const [importMessage, setImportMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleImport = async (e) => {
    e.preventDefault();
    if (!chessUsername) {
      setImportMessage('Please enter your Chess.com username.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chesscom/games?username=${chessUsername}`);
      const data = await response.json();
      if (data.error) {
        setImportMessage(data.error);
      } else {
        const gameTitles = data.games.slice(-10).map((pgn, index) => ({
          title: `Game ${index + 1} - ${chessUsername}`,
          pgn,
        }));
        setGames(gameTitles);
        setImportMessage(`Imported ${gameTitles.length} game(s).`);
      }
    } catch (error) {
      console.error('Error importing games:', error);
      setImportMessage('Failed to import games.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameClick = async (game) => {
    // if (!username) {
    //   setImportMessage('Error: Username is missing. Please log in again.');
    //   return;
    // }
    // if (!game.pgn) {
    //   setImportMessage('Error: PGN is missing for this game.');
    //   return;
    // }

    const requestBody = {
      username,
      pgn: game.pgn,
      analysis: [],
      last_viewed_move: 0,
      comments: [],
    };
    console.log('Sending to /api/save-analysis:', requestBody); // Debug request

    try {
      const response = await fetch('http://localhost:5000/api/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save analysis failed:', errorData);
        setImportMessage(`Failed to save game: ${data.error || 'Unknown error'}`);
        return;
      }
      const data = await response.json();
      console.log('Save analysis success:', data);
      navigate(`/analysis/${data.id}`);
    } catch (error) {
      console.error('Fetch error:', error);
      setImportMessage('Failed to contact server.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>
        Import Games from Chess.com
      </Typography>
      <Typography>Logged in as: {username || 'Not logged in'}</Typography>
      <form onSubmit={handleImport}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            type="text"
            placeholder="Enter Chess.com username"
            value={chessUsername}
            onChange={(e) => setChessUsername(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? 'Importing...' : 'Import Games'}
          </Button>
        </Box>
      </form>
      <Typography>{importMessage}</Typography>
      {games.length > 0 && (
        <Box>
          <Typography variant="h3" sx={{ mt: 2 }}>
            Imported Games:
          </Typography>
          <List>
            {games.map((game, index) => (
              <ListItemButton key={index} onClick={() => handleGameClick(game)}>
                <ListItemText primary={game.title} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

export default ImportGames;