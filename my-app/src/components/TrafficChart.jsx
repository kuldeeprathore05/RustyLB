import React from 'react';
import { TrendingUp } from 'lucide-react';

const TrafficChart = () => {
  // Mock data for the chart
  const data = [
    { time: '00:00', requests: 120 },
    { time: '04:00', requests: 80 },
    { time: '08:00', requests: 280 },
    { time: '12:00', requests: 420 },
    { time: '16:00', requests: 380 },
    { time: '20:00', requests: 240 },
  ];

  const maxRequests = Math.max(...data.map(d => d.requests));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Traffic Overview</h3>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 w-12">
              {item.time}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{
                  width: `${(item.requests / maxRequests) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-16 text-right">
              {item.requests}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Peak: {maxRequests} req/min</span>
          <span>Avg: {Math.round(data.reduce((a, b) => a + b.requests, 0) / data.length)} req/min</span>
        </div>
      </div>
    </div>
  );
};

export default TrafficChart;