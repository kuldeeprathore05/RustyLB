const LoadBalancer = require("./index.js");
const cors  = require('cors');
const express = require('express')
const http = require("http");
const { Server } = require("socket.io");
const lb = new LoadBalancer({
  servers: [
    "https://rustylb.onrender.com",
    "https://rustylb-2.onrender.com",
    "https://rustylb-3.onrender.com"
  ],
  algorithm: "random",
  weights:{
    "https://rustylb.onrender.com":1,
    "https://rustylb-2.onrender.com":2,
    "https://rustylb-3.onrender.com":1
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
  cors:{
    origin:[ "https://balancerboard.vercel.app","https://rustylb-front.onrender.com","https://rustylb-1-nteq.onrender.com", "http://localhost:5173"  ] ,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
  }
})
app.use(express.json())
app.use(cors());

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

  broadcastUpdate();

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

  broadcastUpdate();

  res.json({ message: "Server removed", stats: lb.getServerStats() });
});

// Change algorithm
app.post("/algorithm", (req, res) => {
  const { algorithm } = req.body;
  console.log(algorithm)
  lb.algorithm = algorithm;
  res.json({ message: "Algorithm updated", algorithm });
});

io.on("connection",(socket)=>{
  console.log("Client connected ",socket.id);

  socket.emit("stats",lb.getServerStats());

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
})

function broadcastUpdate() {
  io.emit("stats", lb.getServerStats());
}

setInterval(() => {
  broadcastUpdate();
}, 1000);

server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});