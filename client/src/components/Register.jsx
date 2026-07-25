import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Mail, Lock, User, UserPlus, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/auth`;

const Register = ({ onRegister, onSwitch }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post(`${API_URL}/register`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onRegister(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="auth-card glass-card"
    >
      <div className="auth-header">
        <div className="auth-logo">
          <Shield size={32} color="var(--primary)" />
        </div>
        <h2>Create Account</h2>
        <p>Join Cyber Guard to shield your digital life</p>
      </div>

      {error && (
        <div className="auth-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-field">
          <label>Full Name / Username</label>
          <div className="input-wrapper">
            <User size={18} />
            <input 
              type="text" 
              name="username"
              placeholder="John Doe"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-field">
          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} />
            <input 
              type="email" 
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="input-field">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={18} />
            <input 
              type="password" 
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              minLength="6"
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-btn btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : (
            <>
              <UserPlus size={18} /> Sign Up
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>Already have an account? <button onClick={onSwitch} className="link-btn">Log in instead</button></p>
      </div>

      <style>{`
        .auth-card {
          max-width: 450px;
          margin: 4rem auto;
          padding: 3rem 2.5rem;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .auth-logo {
          width: 60px;
          height: 60px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid var(--glass-border);
        }

        .auth-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-header p {
          color: var(--text-muted);
        }

        .auth-error {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid var(--danger);
          color: var(--danger);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.9rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .input-field label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-wrapper svg {
          position: absolute;
          left: 1rem;
          color: var(--text-muted);
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 3rem;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: var(--text);
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        .auth-btn {
          margin-top: 1rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          font-weight: 600;
        }

        .auth-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .link-btn {
          background: none;
          border: none;
          color: var(--primary);
          padding: 0;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .link-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </motion.div>
  );
};

export default Register;
