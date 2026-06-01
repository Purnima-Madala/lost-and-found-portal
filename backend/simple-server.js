const express = require('express');
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(5002, () => {
  console.log('✅ Simple server running on http://localhost:5002');
  console.log('Test URL: http://localhost:5002/api/test');
});