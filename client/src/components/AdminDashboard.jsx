import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Trash2, ShieldCheck, History, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/admin`;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [allScans, setAllScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, scansRes] = await Promise.all([
        axios.get(`${API_URL}/users`, getAuthHeaders()),
        axios.get(`${API_URL}/scans`, getAuthHeaders())
      ]);
      setUsers(usersRes.data);
      setAllScans(scansRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure? This will delete the user and all their scans.')) return;
    try {
      await axios.delete(`${API_URL}/users/${id}`, getAuthHeaders());
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-container"
    >
      <div className="admin-header">
        <div className="title-group">
          <ShieldCheck color="var(--primary)" size={32} />
          <h1>Admin Control Center</h1>
        </div>
        <button onClick={fetchData} className="refresh-btn">
          <RefreshCw size={18} /> Refresh Data
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Manage Users ({users.length})
        </button>
        <button 
          className={activeTab === 'scans' ? 'admin-tab active' : 'admin-tab'}
          onClick={() => setActiveTab('scans')}
        >
          <History size={18} /> All Global Scans ({allScans.length})
        </button>
      </div>

      <div className="admin-content glass-card">
        {loading ? (
          <div className="loading-state">Loading sensitive data...</div>
        ) : activeTab === 'users' ? (
          <div className="users-list">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="user-td">
                      <div className="user-avatar">{u.username[0]}</div>
                      {u.username}
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => deleteUser(u._id)} 
                        className="delete-btn"
                        disabled={u.role === 'admin'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="scans-list">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Content Preview</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allScans.map(s => (
                  <tr key={s._id}>
                    <td>{s.userId?.username || 'Guest'}</td>
                    <td>{s.type.toUpperCase()}</td>
                    <td>
                      <span className={`risk-tag ${s.riskLevel}`}>{s.riskLevel}</span>
                    </td>
                    <td className="url-td">{s.content.substring(0, 50)}...</td>
                    <td>{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .admin-container {
          padding-top: 2rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--glass);
          border: 1px solid var(--glass-border);
          color: var(--text);
          padding: 0.6rem 1rem;
        }

        .admin-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .admin-tab {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: transparent;
          color: var(--text-muted);
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all 0.3s ease;
        }

        .admin-tab.active {
          background: var(--primary);
          color: white;
        }

        .admin-tab:not(.active):hover {
          background: var(--glass);
          border-color: var(--glass-border);
        }

        .admin-content {
          padding: 0;
          overflow: hidden;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .admin-table th {
          padding: 1.2rem;
          background: rgba(255,255,255,0.03);
          color: var(--text-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .admin-table td {
          padding: 1.2rem;
          border-bottom: 1px solid var(--glass-border);
          font-size: 0.95rem;
        }

        .user-td {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .role-badge {
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .role-badge.admin { background: rgba(99, 102, 241, 0.2); color: var(--primary); }
        .role-badge.user { background: rgba(255,255,255,0.1); color: var(--text-muted); }

        .risk-tag {
          font-weight: 700;
          font-size: 0.8rem;
        }

        .risk-tag.Malicious { color: var(--danger); }
        .risk-tag.Suspicious { color: var(--warning); }
        .risk-tag.Safe { color: var(--safe); }

        .delete-btn {
          background: transparent;
          color: var(--danger);
          opacity: 0.6;
          transition: 0.2s;
        }

        .delete-btn:hover:not(:disabled) {
          opacity: 1;
          transform: scale(1.1);
        }

        .delete-btn:disabled {
          cursor: not-allowed;
          color: var(--text-muted);
        }

        .loading-state {
          padding: 4rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>
    </motion.div>
  );
};

export default AdminDashboard;
