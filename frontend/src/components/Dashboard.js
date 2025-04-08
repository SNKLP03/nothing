import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Card with hover effect
const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#cbeaf6',
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
  },
}));

function Dashboard({ username }) {
  const navigate = useNavigate();
  const [importName, setImportName] = useState('');
  const [importedGames, setImportedGames] = useState([]);
  const [importError, setImportError] = useState('');
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openPopup, setOpenPopup] = useState(false);

  useEffect(() => {
    fetchAnalysisHistory();
  }, [username]);

  const fetchAnalysisHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/analysis-history/${username}`);
      const data = await response.json();
      setAnalysisHistory(data.history || []);
      if (data.history.length === 0) {
        setOpenPopup(true);
      }
    }catch (error) {
      console.error('Error fetching analysis history:', error);
    }
  };

  const handleGameAnalysisClick = () => {
    if (analysisHistory.length > 0) {
      const latestAnalysis = analysisHistory[0]; // Most recent analysis
      navigate(`/analysis/${latestAnalysis.id}`);
    } else {
      setOpenPopup(true); // Show popup if no analysis exists
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleImportGame = async () => {
    if (!importName.trim()) {
      setImportError('Please enter a username.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chesscom/games?username=${importName.trim()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.games && data.games.length > 0) {
        const gameTitles = data.games.slice(-10).map((pgn, index) => ({
          title: `Game ${index + 1} - ${importName}`,
          pgn,
        }));
        setImportedGames(gameTitles);
        setImportName('');
        setImportError('');
      } else {
        setImportError(data.error || 'No games found for this username.');
      }
    } catch (error) {
      console.error('Error importing games:', error);
      setImportError('Failed to fetch games from Chess.com.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#a1d8ef' }}>
        <AppBar position="static" sx={{ bgcolor: '#cbeaf6', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', color: '#000', fontWeight: 'bold' }}>
              Chess Move Predictor
            </Typography>
            <Button
              onClick={handleLogout}
              sx={{ color: '#000', fontFamily: 'Arial, sans-serif', '&:hover': { bgcolor: '#b3e0f2' } }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontFamily: 'Georgia, serif', color: '#000', mb: 4 }}
          >
            Welcome, {username}!
          </Typography>
          <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <StyledCard sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
              <Box
                sx={{
                  height: '60%',
                  bgcolor: 'grey',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body1" sx={{ color: '#fff' }}>
                  Image Placeholder
                </Typography>
              </Box>
              <CardContent>
                <Typography variant="h5" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                  Game Analysis
                </Typography>
                <Typography variant="body2" sx={{ color: '#333', fontFamily: 'Arial, sans-serif', mt: 1 }}>
                  Analyze your PGN files to improve your strategy.
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', mt: 'auto' }}>
                <Button onClick={handleGameAnalysisClick} sx={{ color: '#000' }}>
                  Go
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
          <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
            <DialogTitle>Welcome!</DialogTitle>
            <DialogContent>
              <Typography>
                It looks like you haven’t analyzed any games yet. Please import games from the "Import Games" section first!
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPopup(false)} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <Grid item xs={12} md={4}>
            <StyledCard sx={{ height: 400 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                  Analysis History
                </Typography>
                <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                  <List>
                    {analysisHistory.map((entry) => (
                      <ListItem key={entry.id} disablePadding>
                        <ListItemButton onClick={() => navigate(`/analysis/${entry.id}`)}>
                          <ListItemText
                            primary={`Game - ${new Date(entry.timestamp).toLocaleDateString()}`}
                            primaryTypographyProps={{ fontFamily: 'Arial, sans-serif', color: '#333' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center' }}>
                <Button component={Link} to="history" sx={{ color: '#000' }}>
                  Go
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>

            <Grid item xs={12} md={8}>
              <StyledCard sx={{ height: 300 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                    Import Games from Chess.com
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <TextField
                      label="Chess.com Username"
                      variant="outlined"
                      size="small"
                      value={importName}
                      onChange={(e) => setImportName(e.target.value)}
                      sx={{ flexGrow: 1, input: { color: '#000' }, label: { color: '#000' } }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleImportGame}
                      disabled={isLoading}
                      sx={{ bgcolor: '#cbeaf6', color: '#000', '&:hover': { bgcolor: '#b3e0f2' } }}
                    >
                      {isLoading ? 'Importing...' : 'Import'}
                    </Button>
                  </Box>
                  {importError && (
                    <Typography variant="body2" sx={{ color: 'red', mt: 1 }}>
                      {importError}
                    </Typography>
                  )}
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', mt: 2 }}>
                    <List>
                      {importedGames.map((game, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemButton
                            onClick={async () => {
                              const response = await fetch('http://localhost:5000/api/save-analysis', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  username,
                                  pgn: game.pgn,
                                  analysis: [],
                                  last_viewed_move: 0,
                                  comments: [],
                                }),
                              });
                              const data = await response.json();
                              navigate(`/analysis/${data.id}`);
                            }}
                          >
                            <ListItemText
                              primary={game.title}
                              primaryTypographyProps={{ fontFamily: 'Arial, sans-serif', color: '#333' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <StyledCard sx={{ height: 300 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                    Predict Move
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#333', fontFamily: 'Arial, sans-serif', mt: 1 }}
                  >
                    Upload an image to predict the best move.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', mt: 'auto' }}>
                  <Button component={Link} to="predict" sx={{ color: '#000' }}>
                    Go
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledCard sx={{ height: 200 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                    Learn from Grand Master
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#333', fontFamily: 'Arial, sans-serif', mt: 1 }}
                  >
                    Study moves and tactics from top players.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button component={Link} to="learn-grandmaster" sx={{ color: '#000' }}>
                    Go
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={3}>
              <StyledCard sx={{ height: 200 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                    Find and Learn
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#333', fontFamily: 'Arial, sans-serif', mt: 1 }}
                  >
                    Discover new games and lessons.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button component={Link} to="find-learn" sx={{ color: '#000' }}>
                    Go
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>

            <Grid item xs={12} md={3}>
              <StyledCard sx={{ height: 200 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', color: '#000' }}>
                    Chess Books
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#333', fontFamily: 'Arial, sans-serif', mt: 1 }}
                  >
                    Explore recommended chess literature.
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button component={Link} to="chess-books" sx={{ color: '#000' }}>
                    Go
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Outlet />
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default Dashboard;