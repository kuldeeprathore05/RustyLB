const LoadBalancer = require("./index.js");
const express = require('express')
const lb = new LoadBalancer({
  servers: [
    "http://localhost:8001",
    "http://localhost:8002",
    "http://localhost:8003"
  ],
  algorithm: "random",
  weights:{
    "http://localhost:8001":1,
    "http://localhost:8002":2,
    "http://localhost:8003":1
  }
});

const app = express();
app.use(express.json())
app.get('/', async(req, res) => {
  try {
    const result = await lb.request("/");
    console.log("Response:", result.data, "Handled by:", result.server);

    res.json({ message: result.data.message });
  } catch (error) {
    console.error("Load balancer request failed:", error.message);
    res.status(502).json({ error: "Bad Gateway: backend unavailable" });
  }
});

app.listen(8000,"0.0.0.0", () => {
  console.log('Server running on http://localhost:8000');
});
