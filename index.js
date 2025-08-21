const axios = require('axios');

class LoadBalancer {
  constructor(options = {}) {
    this.servers = options.servers || [];
    this.algorithm = options.algorithm || 'round-robin';
   
    // Internal state
    this.currentIndex = 0;
    this.serverConnections = new Map(); // Track connections per server
    this.serverWeights = new Map(); // Track weights for weighted round-robin
    this.serverResponseTimes = new Map(); // Track response times for fastest response
    this.serverHealthy = new Map(); // Track server health status
   
    // Initialize connection counts and health status
    this.servers.forEach(server => {
      this.serverConnections.set(server, 0);
      this.serverWeights.set(server, options.weights?.[server] || 1); // Default weight is 1
      this.serverResponseTimes.set(server, 0);
      this.serverHealthy.set(server, true);
    });

    // For weighted round-robin
    this.weightedIndex = 0;
    this.currentWeightedServer = null;
    this.currentWeight = 0;
  }

  // Round Robin Algorithm
  roundRobin() {
    const server = this.servers[this.currentIndex % this.servers.length];
    this.currentIndex++;
    return server;
  }

  // Least Connections Algorithm
  leastConnections() {
    let selectedServer = this.servers[0];
    let minConnections = this.serverConnections.get(selectedServer);
    
    for (const server of this.servers) {
      const connections = this.serverConnections.get(server);
      if (connections < minConnections && this.serverHealthy.get(server)) {
        minConnections = connections;
        selectedServer = server;
      }
    }
    return selectedServer;
  }

  // Weighted Round Robin Algorithm
  weightedRoundRobin() {
    if (this.servers.length === 0) return null;

    const healthyServers = this.servers.filter(server => this.serverHealthy.get(server));
    if (healthyServers.length === 0) return this.servers[0]; // Fallback

    // Simple weighted round-robin implementation
    const weightedServers = [];
    healthyServers.forEach(server => {
      const weight = this.serverWeights.get(server) || 1;
      for (let i = 0; i < weight; i++) {
        weightedServers.push(server);
      }
    });

    const selected = weightedServers[this.weightedIndex % weightedServers.length];
    this.weightedIndex++;
    return selected;
  }

  // Random Algorithm
  random() {
    const healthyServers = this.servers.filter(server => this.serverHealthy.get(server));
    // if (healthyServers.length === 0) return this.servers[0]; // Fallback to first server
    
    const randomIndex = Math.floor(Math.random() * healthyServers.length);
    return healthyServers[randomIndex];
  }

  // Fastest Response Time Algorithm
  fastestResponse() {
    let selectedServer = this.servers[0];
    let fastestTime = this.serverResponseTimes.get(selectedServer) || Infinity;
    
    for (const server of this.servers) {
      const responseTime = this.serverResponseTimes.get(server) || Infinity;
      if (responseTime < fastestTime && this.serverHealthy.get(server)) {
        fastestTime = responseTime;
        selectedServer = server;
      }
    }
    
    // If all servers have 0 response time (first requests), fall back to round-robin
    if (fastestTime === 0 || fastestTime === Infinity) {
      return this.roundRobin();
    }
    
    return selectedServer;
  }

  // Select server based on algorithm
  selectServer() {
    switch (this.algorithm) {
      case 'round-robin':
        return this.roundRobin();
      case 'least-connections':
        return this.leastConnections();
      case 'weighted-round-robin':
        return this.weightedRoundRobin();
      case 'random':
        return this.random();
      case 'fastest-response':
        return this.fastestResponse();
      default:
        return this.roundRobin();
    }
  }

  // Make HTTP request through load balancer
  async request(path, options = {}) {
    const server = this.selectServer();
    const url = `${server}${path}`;
    const startTime = Date.now();
   
    // Increment connection count
    this.serverConnections.set(server, this.serverConnections.get(server) + 1);
    
    this.servers.forEach(srv => {
      console.log(srv, " : ", this.serverConnections.get(srv));
    });

    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        data: options.data,
        params: options.params,
      });

      // Calculate and update response time
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(server, responseTime);
      
      // Mark server as healthy if request succeeds
      this.serverHealthy.set(server, true);

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        server: server,  // Which server handled the request
        responseTime: responseTime
      };
    } catch (error) {
      // If request fails, mark server as potentially unhealthy
      console.error(`Request to ${server} failed:`, error.message);
      this.serverHealthy.set(server, false);
      
      // Update response time even for failed requests (set to high value)
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(server, responseTime * 10); // Penalize failed requests
      
      throw error;
    } finally {
      // Decrement connection count
      this.serverConnections.set(server, this.serverConnections.get(server) - 1);
    }
  }

  // Update response time with exponential moving average
  updateResponseTime(server, newTime) {
    const currentAvg = this.serverResponseTimes.get(server) || 0;
    const alpha = 0.3; // Smoothing factor
    const newAvg = currentAvg === 0 ? newTime : (alpha * newTime) + ((1 - alpha) * currentAvg);
    this.serverResponseTimes.set(server, newAvg);
  }

  // Utility method to set server weights (for weighted round-robin)
  setServerWeight(server, weight) {
    if (this.servers.includes(server)) {
      this.serverWeights.set(server, weight);
    }
  }

  // Utility method to get server statistics
  getServerStats() {
    const stats = {};
    this.servers.forEach(server => {
      stats[server] = {
        connections: this.serverConnections.get(server),
        weight: this.serverWeights.get(server),
        avgResponseTime: Math.round(this.serverResponseTimes.get(server) || 0),
        healthy: this.serverHealthy.get(server)
      };
    });
    return stats;
  }

  // Utility method to reset server health (useful for recovery)
  resetServerHealth() {
    this.servers.forEach(server => {
      this.serverHealthy.set(server, true);
    });
  }
}

module.exports = LoadBalancer;