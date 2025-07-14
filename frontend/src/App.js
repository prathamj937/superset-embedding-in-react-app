import React, { useState, useEffect } from 'react';
import { User, Settings, BarChart3, Shield, Eye, EyeOff, LogOut } from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiService = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  getUserDashboards: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get dashboards error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  getAllUsers: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  toggleAccess: async (token, user_id, dashboard_id, can_access) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/toggle-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id, dashboard_id, can_access }),
      });
      return await response.json();
    } catch (error) {
      console.error('Toggle access error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  generateDashboardJWT: async (token, dashboard_id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-dashboard-jwt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ dashboard_id }),
      });
      return await response.json();
    } catch (error) {
      console.error('Generate JWT error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Dashboard configurations
const dashboardConfigs = [
  { 
    id: 'sales', 
    name: 'Sales Dashboard', 
    description: 'Sales performance metrics and analytics',
    supersetUrl: process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088',
    supersetDashboardId: '1' 
  },
  { 
    id: 'hr', 
    name: 'HR Dashboard', 
    description: 'Human resources analytics and reports',
    supersetUrl: process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088',
    supersetDashboardId: '2' 
  },
  { 
    id: 'finance', 
    name: 'Finance Dashboard', 
    description: 'Financial reports and KPIs',
    supersetUrl: process.env.REACT_APP_SUPERSET_URL || 'http://localhost:8088',
    supersetDashboardId: '3' 
  }
];

// Superset Dashboard Component
const SupersetDashboard = ({ dashboardConfig, jwt }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [dashboardConfig.id, jwt]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load dashboard');
  };

  if (!jwt) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <BarChart3 className="mx-auto h-16 w-16 mb-4" />
          <p>No JWT token available</p>
        </div>
      </div>
    );
  }

  // Construct the Superset embed URL
  const embedUrl = `${dashboardConfig.supersetUrl}/embedded/dashboard/${dashboardConfig.supersetDashboardId}/?token=${jwt}`;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{dashboardConfig.name}</h3>
        <div className="text-xs text-gray-500">JWT: {jwt.substring(0, 20)}...</div>
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 h-64 flex items-center justify-center">
          <div className="text-center text-red-600">
            <BarChart3 className="mx-auto h-16 w-16 mb-4" />
            <p>{error}</p>
            <p className="text-sm mt-2">Check your Superset configuration</p>
          </div>
        </div>
      )}
      
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        title={`${dashboardConfig.name} - Superset Dashboard`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoading || error ? 'none' : 'block' }}
        allowFullScreen
      />
    </div>
  );
};

// Login Component
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await apiService.login(username, password);
    
    if (result.success) {
      onLogin(result.user, result.token);
    } else {
      setError(result.message || 'Login failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dashboard Management System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Superset Integration</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (try: manager, john, jane)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (password123)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Manager Dashboard Component
const ManagerDashboard = ({ user, token, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [userAccess, setUserAccess] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await apiService.getAllUsers(token);
    
    if (result.success) {
      setUsers(result.users);
      
      // Load access data for each user
      const accessData = {};
      for (const user of result.users) {
        const response = await fetch(`${API_BASE_URL}/api/user-dashboard-access/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const accessResult = await response.json();
        if (accessResult.success) {
          accessData[user.id] = accessResult.access;
        }
      }

      setUserAccess(accessData);
    }
    
    setIsLoading(false);
  };

  const handleToggleAccess = async (userId, dashboardId) => {
    const currentAccess = userAccess[userId]?.[dashboardId] || false;
    const newAccess = !currentAccess;
    
    const result = await apiService.toggleAccess(token, userId, dashboardId, newAccess);
    
    if (result.success) {
      setUserAccess(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          [dashboardId]: newAccess
        }
      }));
      setMessage('Access updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(`Error: ${result.message}`);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Dashboard Access Control</h3>
            
            <div className="space-y-6">
              {users.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                    <span className="ml-2 text-sm text-gray-500">(@{user.username})</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboardConfigs.map(dashboard => (
                      <div key={dashboard.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{dashboard.name}</p>
                          <p className="text-sm text-gray-500">{dashboard.description}</p>
                        </div>
                        <button
                          onClick={() => handleToggleAccess(user.id, dashboard.id)}
                          className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            userAccess[user.id]?.[dashboard.id]
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {userAccess[user.id]?.[dashboard.id] ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              ON
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              OFF
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Dashboard Component
const UserDashboard = ({ user, token, onLogout }) => {
  const [userAccess, setUserAccess] = useState({});
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [dashboardJWT, setDashboardJWT] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserAccess();
  }, []);

  const loadUserAccess = async () => {
    const result = await apiService.getUserDashboards(token);
    if (result.success) {
      setUserAccess(result.access);
    }
    setIsLoading(false);
  };

  const handleDashboardClick = async (dashboardConfig) => {
    const result = await apiService.generateDashboardJWT(token, dashboardConfig.id);
    if (result.success) {
      setDashboardJWT(result.jwt);
      setSelectedDashboard(dashboardConfig);
    } else {
      alert(`Error: ${result.message}`);
    }
  };

  const allowedDashboards = dashboardConfigs.filter(d => userAccess[d.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">My Dashboards</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.name}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dashboard List */}
          <div className="lg:col-span-1">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Dashboards</h3>
                
                {allowedDashboards.length === 0 ? (
                  <p className="text-gray-500">No dashboards assigned to you yet.</p>
                ) : (
                  <div className="space-y-2">
                    {allowedDashboards.map(dashboard => (
                      <button
                        key={dashboard.id}
                        onClick={() => handleDashboardClick(dashboard)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedDashboard?.id === dashboard.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{dashboard.name}</div>
                        <div className="text-sm text-gray-500">{dashboard.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Viewer */}
          <div className="lg:col-span-2">
            {selectedDashboard ? (
              <SupersetDashboard dashboardConfig={selectedDashboard} jwt={dashboardJWT} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="mx-auto h-16 w-16 mb-4" />
                  <p>Select a dashboard to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.isManager) {
    return <ManagerDashboard user={user} token={token} onLogout={handleLogout} />;
  }

  return <UserDashboard user={user} token={token} onLogout={handleLogout} />;
};

export default App; 