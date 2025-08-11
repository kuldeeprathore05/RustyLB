const LoadBalancer = require("./index.js");
const express = require('express')
const lb = new LoadBalancer({
  servers: [
    "http://localhost:8001",
    "http://localhost:8002",
    "http://localhost:8003"
  ],
  algorithm: "least-connections"
});

const app = express();
app.use(express.json())
app.get('/', async(req, res) => {
  const result = await lb.request("/");
  console.log("Response:", result.data, "Handled by:", result.server)
  
  res.json({ message: result.data.message});
});

app.listen(8000,"0.0.0.0", () => {
  console.log('Server running on http://localhost:8000');
});
