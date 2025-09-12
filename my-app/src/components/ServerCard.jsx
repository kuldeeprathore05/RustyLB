import React from 'react';
import { Server, Activity, AlertCircle, CheckCircle,   Trash2, Weight } from 'lucide-react';

// interface ServerCardProps {
//   id: string;
//   name: string;
//   ip: string;
//   port: number;
//   status: 'healthy' | 'warning' | 'error';
//   responseTime: number;
//   connections: number;
//   uptime: string;
//   onRemove: (id: string) => void;
// }

const ServerCard  = ({
  id,
  name,
  ip,
  port,
  status,
  responseTime,
  connections,
  weight,
  onRemove,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className={`bg-white rounded-lg border-2 ${getStatusColor()} p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Server className="w-6 h-6 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{ip}:{port}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <button
            onClick={() => onRemove(id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="font-medium text-gray-900">{responseTime}ms</p>
          <p className="text-gray-500">Response</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Server className="w-4 h-4 text-purple-500" />
          </div>
          <p className="font-medium text-gray-900">{connections}</p>
          <p className="text-gray-500">Connections</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Weight className="w-4 h-4 text-slate-500" />
          </div>
          <p className="font-medium text-gray-900">{weight}</p>
          <p className="text-gray-500">Weight</p>
        </div>
      </div>
    </div>
  );
};

export default ServerCard;

