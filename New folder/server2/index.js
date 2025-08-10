import express from 'express'
const app = express();
app.use(express.json())
app.get('/', (req, res) => {
  console.log('Received POST data:', req.body);
  res.json({ message: 'Server2 request received', data: req.body });
});

app.listen(8002, () => {
  console.log('Server running on http://localhost:8002');
});