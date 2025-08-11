
    // loadbalancer-sdk/index.js
const axios = require('axios');

class LoadBalancer {
  constructor(options = {}) {
    this.servers = options.servers || [];
    this.algorithm = options.algorithm || 'round-robin';

    
    // Internal state
    this.currentIndex = 0;
    this.serverConnections = new Map(); // Track connections per server
    
    // Initialize connection counts
    this.servers.forEach(server => {
      //console.log(server);
      this.serverConnections.set(server, 0);
    });

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
      if (connections < minConnections) {
        minConnections = connections;
        selectedServer = server;
      }
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
      default:
        return this.roundRobin();
    }
  }

  // Make HTTP request through load balancer
  async request(path, options = {}) {
    const serve = this.selectServer();
    const url = `${serve}${path}`;
    
    // Increment connection count
    this.serverConnections.set(serve, this.serverConnections.get(serve) + 1);
    this.servers.forEach(server => {
      console.log(server," : ",this.serverConnections.get(server) );
    });
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        data: options.data,
        params: options.params,
      });

      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
        server: serve  // Which server handled the request
      };
    } catch (error) {
      // If request fails, mark server as potentially unhealthy
      console.error(`Request to ${serve } failed:`, error.message);
      throw error;
    } finally {
      // Decrement connection count
      this.serverConnections.set(serve , this.serverConnections.get(serve) - 1);
    }
  }
 
}

module.exports = LoadBalancer;