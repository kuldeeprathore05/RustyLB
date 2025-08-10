import express from 'express'
const app = express();
app.use(express.json())
app.get('/', (req, res) => {
  console.log('Received POST data:', req.body);
  res.json({ message: 'Server1 request received', data: req.body });
});

app.listen(8001, () => {
  console.log('Server running on http://localhost:8001');
});