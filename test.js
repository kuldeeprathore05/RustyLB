const LoadBalancer = require("./index.js");
const cors  = require('cors');
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
app.use(cors({
  origin: 'http://localhost:5173',  // or 3000 if CRA
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type']
}));
app.get('/', async(req, res) => {
  console.log("Response:");
  try {
    const result = await lb.request("/");
    console.log("Response:", result.data, "Handled by:", result.server);

    res.json({ message: result.data.message });
  } catch (error) {
    console.error("Load balancer request failed:", error.message);
    res.status(502).json({ error: "Bad Gateway: backend unavailable" });
  }
});
 
 
// Get all servers + stats
app.get("/servers", (req, res) => {
  console.log("request for fetching revieved")
  res.json(lb.getServerStats());
});

// Add a new server
app.post("/servers", (req, res) => {
  const { url, weight } = req.body;
  console.log("request for adding revieved")
  if (!url) return res.status(400).json({ error: "Server URL is required" });

  lb.servers.push(url);
  lb.serverConnections.set(url, 0);
  lb.serverWeights.set(url, weight || 1);
  lb.serverResponseTimes.set(url, 0);
  lb.serverHealthy.set(url, true);

  res.json({ message: "Server added", stats: lb.getServerStats() });
});

// Remove a server
app.delete("/servers/:encodedUrl", (req, res) => {
  const url = decodeURIComponent(req.params.encodedUrl);
  lb.servers = lb.servers.filter((s) => s !== url);

  lb.serverConnections.delete(url);
  lb.serverWeights.delete(url);
  lb.serverResponseTimes.delete(url);
  lb.serverHealthy.delete(url);

  res.json({ message: "Server removed", stats: lb.getServerStats() });
});

// Change algorithm
app.post("/algorithm", (req, res) => {
  const { algorithm } = req.body;
  console.log(algorithm)
  lb.algorithm = algorithm;
  res.json({ message: "Algorithm updated", algorithm });
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});