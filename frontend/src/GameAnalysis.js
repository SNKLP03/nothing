import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import {
  Box,
  Typography,
  Button,
  TextField,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

function GameAnalysis({ username }) {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [pgn, setPgn] = useState('');
  const [analysis, setAnalysis] = useState([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [selectedFEN, setSelectedFEN] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (analysisId && analysisId !== 'new') {
      setIsLoading(true);
      fetch(`http://localhost:5000/api/analysis-history/${username}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const entry = data.history.find((h) => h.id === analysisId);
          if (entry) {
            setPgn(entry.pgn);
            if (entry.analysis.length > 0) {
              setAnalysis(entry.analysis);
              const lastMove = entry.last_viewed_move || 0;
              setCurrentMove(lastMove);
              setSelectedFEN(entry.analysis[lastMove]?.board_fen || null);
              setComment(entry.comments?.[lastMove] || '');
            } else {
              handleAnalyze(null, entry.pgn);
            }
          } else {
            setError('Analysis not found');
          }
        })
        .catch((err) => setError('Failed to load analysis history: ' + err.message))
        .finally(() => setIsLoading(false));
    }
  }, [analysisId, username]);

  const handleAnalyze = async (e, pgnToAnalyze = pgn) => {
    if (e) e.preventDefault();
    if (!pgnToAnalyze) {
      setError('Please enter a PGN.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/analyze_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn: pgnToAnalyze }),
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        setCurrentMove(0);
        setSelectedFEN(data.analysis[0].board_fen);
        setError('');

        if (!analysisId || analysisId === 'new') {
          const saveResponse = await fetch('http://localhost:5000/api/save-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              pgn: pgnToAnalyze,
              analysis: data.analysis,
              last_viewed_move: 0,
              comments: [],
            }),
          });
          const saveData = await saveResponse.json();
          navigate(`/analysis/${saveData.id}`);
        } else {
          await fetch(`http://localhost:5000/api/update-last-viewed/${analysisId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_viewed_move: 0, analysis: data.analysis }),
          });
        }
      } else {
        setError('Analysis failed.');
      }
    } catch (error) {
      setError('Error analyzing game: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveClick = (moveIndex) => {
    setCurrentMove(moveIndex);
    setSelectedFEN(analysis[moveIndex].board_fen);
    setComment(analysis.comments?.[moveIndex] || '');
    if (analysisId && analysisId !== 'new') {
      fetch(`http://localhost:5000/api/update-last-viewed/${analysisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_viewed_move: moveIndex }),
      }).catch((err) => console.error('Failed to update last viewed:', err));
    }
  };

  const handleMoveChange = (direction) => {
    const newMove = direction === 'next' ? currentMove + 1 : currentMove - 1;
    if (newMove >= 0 && newMove < analysis.length) {
      setCurrentMove(newMove);
      setSelectedFEN(analysis[newMove].board_fen);
      setComment(analysis.comments?.[newMove] || '');
      if (analysisId && analysisId !== 'new') {
        fetch(`http://localhost:5000/api/update-last-viewed/${analysisId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ last_viewed_move: newMove }),
        }).catch((err) => console.error('Failed to update last viewed:', err));
      }
    }
  };

  const handleCommentSave = async () => {
    if (analysisId && analysisId !== 'new') {
      const updatedComments = analysis.comments ? [...analysis.comments] : new Array(analysis.length).fill('');
      updatedComments[currentMove] = comment;
      await fetch(`http://localhost:5000/api/update-last-viewed/${analysisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_viewed_move: currentMove,
          comments: updatedComments,
        }),
      }).catch((err) => console.error('Failed to save comment:', err));
      setAnalysis((prev) => ({ ...prev, comments: updatedComments }));
    }
  };

  // Custom move annotation function
  const getMoveAnnotation = (moveIndex) => {
    const evalDiff = Math.abs(analysis[moveIndex].evaluation - analysis[moveIndex].predicted_evaluation);
    if (evalDiff > 2) return { symbol: '??', color: 'red', message: 'Blunder' };
    if (evalDiff > 0.5) return { symbol: '?!', color: 'orange', message: 'Mistake' };
    if (evalDiff < -0.5) return { symbol: '!!', color: 'green', message: 'Excellent' };
    return { symbol: '', color: 'black', message: 'Normal' };
  };

  return (
    <Container sx={{ mt: 4, backgroundColor: '#2d2d2d', color: '#fff', padding: 2 }}>
      <Typography variant="h4" sx={{ fontFamily: 'Georgia, serif', mb: 2 }}>
        Game Review
      </Typography>
      {isLoading && <Typography>Loading...</Typography>}
      {!isLoading && (!analysisId || analysisId === 'new') && (
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Paste PGN here"
            multiline
            rows={4}
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            fullWidth
            sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#fff' } }}
          />
          <Button variant="contained" onClick={handleAnalyze} disabled={isLoading} sx={{ backgroundColor: '#4caf50', color: '#fff' }}>
            Analyze
          </Button>
        </Box>
      )}
      {error && (
        <Typography variant="body2" sx={{ color: 'red', mb: 2 }}>
          {error}
        </Typography>
      )}
      {!isLoading && analysisId !== 'new' && analysis.length > 0 && (
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Chessboard
              position={selectedFEN || analysis[0].board_fen}
              width={400}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              }}
              customSquareStyles={() => {
                const styles = {};
                if (analysis[currentMove].played_move) {
                  const move = analysis[currentMove].played_move;
                  const fromSquare = move.slice(0, 2);
                  const toSquare = move.slice(2, 4);
                  styles[fromSquare] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' };
                  styles[toSquare] = { backgroundColor: getMoveAnnotation(currentMove).color === 'red' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 255, 0, 0.4)' };
                }
                return styles;
              }}
            />
            <Box sx={{ mt: 2, color: '#fff' }}>
              <Typography variant="h6">Move {currentMove + 1}</Typography>
              <Typography>Played: {analysis[currentMove].played_move}</Typography>
              <Typography>Evaluation: {analysis[currentMove].evaluation.toFixed(2)}</Typography>
              <Typography>Best Move: {analysis[currentMove].predicted_best_move}</Typography>
              <Typography>Best Eval: {analysis[currentMove].predicted_evaluation.toFixed(2)}</Typography>
              <Typography>
                Annotation: {getMoveAnnotation(currentMove).symbol}{' '}
                {getMoveAnnotation(currentMove).message}
              </Typography>
              <TextField
                label="Your Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                fullWidth
                sx={{ mt: 1, input: { color: '#fff' }, label: { color: '#fff' } }}
              />
              <Box sx={{ mt: 2 }}>
                <Button
                  onClick={() => handleMoveChange('prev')}
                  disabled={currentMove === 0}
                  sx={{ mr: 1, backgroundColor: '#4caf50', color: '#fff' }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handleMoveChange('next')}
                  disabled={currentMove === analysis.length - 1}
                  sx={{ mr: 1, backgroundColor: '#4caf50', color: '#fff' }}
                >
                  Next
                </Button>
                <Button onClick={handleCommentSave} sx={{ backgroundColor: '#4caf50', color: '#fff' }}>
                  Save Comment
                </Button>
              </Box>
            </Box>
          </Box>
          <Box sx={{ flex: 1, maxHeight: 500, overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>Move List</Typography>
            <List>
              {analysis.map((moveInfo, index) => {
                const annotation = getMoveAnnotation(index);
                return (
                  <ListItem key={moveInfo.move_number} disablePadding>
                    <ListItemButton onClick={() => handleMoveClick(index)}>
                      <ListItemText
                        primary={`${moveInfo.move_number}. ${moveInfo.played_move} ${annotation.symbol}`}
                        secondary={`Eval: ${moveInfo.evaluation.toFixed(2)}`}
                        primaryTypographyProps={{ fontFamily: 'Arial, sans-serif', color: '#fff' }}
                        secondaryTypographyProps={{ color: '#bbb' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </Box>
      )}
      {/* Placeholder for evaluation graph (to be implemented) */}
      <Box sx={{ mt: 2, height: 50, backgroundColor: '#333', borderRadius: 4 }}>
        <Typography sx={{ color: '#fff', textAlign: 'center' }}>Evaluation Graph (Coming Soon)</Typography>
      </Box>
    </Container>
  );
}

export default GameAnalysis;