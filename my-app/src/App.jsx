import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  Server, 
  Zap, 
  Users, 
  Plus, 
  Settings, 
  BarChart3
} from 'lucide-react';
import ServerCard from './components/ServerCard';
import MetricCard from './components/MetricCard';
import AddServerModal from './components/AddServerModal';
import { io } from "socket.io-client";


function App() {
  let LoadBalancer = "https://rustylb-vz2m.onrender.com";
  const [servers, setServers] = useState([]);
  const [algorithm, setAlgorithm] = useState("round-robin");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch servers on load
  useEffect(() => {
    const socket = io(`${LoadBalancer}`);
  
    socket.on("connect", () => {
      console.log("Connected to Socket.IO:", socket.id);
      setIsConnected(true);
    });
  
    socket.on("stats", (stats) => {
      const serverList = Object.entries(stats).map(([url, s]) => ({
        id: url,
        name: url,
        ip: url,
        port: "",
        status: s.healthy ? "healthy" : "error",
        responseTime: s.avgResponseTime,
        connections: s.connections,
        weight:s.weight,
        requestsPerMinute: s.requestsPerMinute || 0,
      }));
      setServers(serverList);
    });
  
    socket.on("algorithm", (alg) => {
      setAlgorithm(alg);
    });
  
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });
  
    return () => socket.disconnect();
  }, []);

  const fetchServers = async () => {
   { console.log("HElllo fetchSerer")}
    const res = await axios.get(`${LoadBalancer}/servers`);

    const serverList = Object.entries(res.data).map(([url, stats]) => ({
      id: url,
      name: url, 
      ip: url,
      port: "",
      status: stats.healthy ? "healthy" : "error",
      responseTime: stats.avgResponseTime,
      connections: stats.connections,
      weight:stats.weight,
      requestsPerMinute: stats.requestsPerMinute,
    }));
    setServers(serverList);
  };

  const handleAddServer = async (serverData) => {
    console.log("HElllo addServer")
    await axios.post(`${LoadBalancer}/servers`, {
      url: `http://${serverData.ip}:${serverData.port}`,
      weight: 1
    });
    fetchServers();
  };

  const handleRemoveServer = async (id) => {
    console.log("HElllo addServer")
    await axios.delete(`${LoadBalancer}/servers/${encodeURIComponent(id)}`);
    fetchServers();
  };

  const handleAlgorithmChange = async (alg) => {
    setAlgorithm(alg);
    await axios.post(`${LoadBalancer}/algorithm`, { algorithm: alg });
  };
   

  const healthyServers = servers.filter(s => s.status === 'healthy').length;
  const totalConnections = servers.reduce((sum, s) => sum + s.connections, 0);
  const avgResponseTime = Math.round(
    servers.filter(s => s.responseTime > 0).reduce((sum, s) => sum + s.responseTime, 0) / 
    servers.filter(s => s.responseTime > 0).length
  );
  const requestperminute = servers.reduce((sum, s)=> sum + (s.requestsPerMinute || 0), 0);
  return (
    <div className="min-h-screen min-w-screen mx-auto ">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-l font-bold text-gray-900">BalancerBoard</h2>
                <p className="text-sm text-gray-500">Server Load Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                ${isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                {isConnected ? "Online" : "Offline"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Servers"
            value={`${healthyServers}/${servers.length}`}
            change={healthyServers === servers.length ? `100%`:`${(100*healthyServers/servers.length).toFixed(2)}%`}
            changeType={healthyServers === servers.length ? "positive" : "negative"}
            icon={Server}
            iconColor="bg-blue-600"
          />
          
          <MetricCard
            title="Total Connections"
            value={totalConnections.toString()}
            changeType="positive"
            icon={Users}
            iconColor="bg-green-600"
          />
          
          <MetricCard
            title="Avg Response Time"
            value={`${avgResponseTime}ms`}
            changeType="positive"
            icon={Activity}
            iconColor="bg-purple-600"
          />
          
          <MetricCard
            title="Requests/min"
            value={requestperminute}
            changeType="positive"
            icon={BarChart3}
            iconColor="bg-orange-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Load Balancing Configuration */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Load Balancing Algorithm
                </label>
                <select 
                  value={algorithm}
                  onChange={(e) => handleAlgorithmChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="round-robin">Round Robin</option>
                  <option value="weighted">Weighted Round Robin</option>
                  <option value="least-connections">Least Connections</option>
                  <option value="ip-hash">IP Hash</option>
                </select>
              </div>
              
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Health Check Interval</span>
                  <span className="font-medium">30s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Timeout</span>
                  <span className="font-medium">5s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Max Retries</span>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Server Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Server Pool</h2>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Server
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {servers.map((server) => (
                    <ServerCard
                      key={server.id}
                      {...server}
                      onRemove={handleRemoveServer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div> 

        
      </div>

      <AddServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddServer}
      />
      {/* <BackgroundBeams /> */}
    </div>
  );
}

export default App;