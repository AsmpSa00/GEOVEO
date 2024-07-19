const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const cors = require('cors');
const port = 3000;

app.use(cors());
app.use(express.static('public'));

app.get('/api/satellite-positions/:sat_id', async (req, res) => {
  const { sat_id } = req.params;
  const url = `http://localhost:5001/get_positions/${sat_id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error connecting to Python service:', error.message);
    res.status(500).send('Service unavailable');
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
