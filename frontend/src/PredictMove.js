import React, { useState } from 'react';
import { Box, Typography, Button, Input } from '@mui/material';
import { Chessboard } from 'react-chessboard';

function PredictMove() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const response = await fetch('http://localhost:5000/api/predict_move', {
        method: 'POST',
        body: formData,
      });
      const resData = await response.json();
      setResult(resData);
    } catch (error) {
      console.error('Prediction error:', error);
      setResult({ error: 'Prediction failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h2" sx={{ mb: 2 }}>
        Upload Chessboard Image for Move Prediction
      </Typography>
      <form onSubmit={handlePredict}>
        <Input type="file" onChange={handleFileChange} accept="image/*" sx={{ mb: 2 }} />
        <br />
        <Button type="submit" variant="contained" disabled={isLoading}>
          {isLoading ? 'Predicting...' : 'Predict Best Move'}
        </Button>
      </form>
      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4">Prediction Result:</Typography>
          {result.error ? (
            <Typography color="error">{result.error}</Typography>
          ) : (
            <>
              <Chessboard position={result.fen} width={400} />
              <Typography>FEN: {result.fen}</Typography>
              <Typography>Best Move: {result.best_move}</Typography>
              <Typography>Evaluation Score: {result.evaluation.toFixed(4)}</Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default PredictMove;