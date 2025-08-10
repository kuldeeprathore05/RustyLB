import express from 'express'
const app = express();
app.use(express.json())
app.get('/', (req, res) => {
  console.log('Received POST data:', req.body);
  res.json({ message: 'Server3 request received', data: req.body });
});

app.listen(8003,"0.0.0.0", () => {
  console.log('Server running on http://localhost:8003');
});