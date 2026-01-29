import React, { useState, useEffect } from 'react';
import { doctorsAPI, slotsAPI, tokensAPI, healthCheck } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    doctors: 0,
    slots: 0,
    tokens: 0,
    activeTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      
      const [doctorsRes, slotsRes, tokensRes, healthRes] = await Promise.all([
        doctorsAPI.getAll(),
        slotsAPI.getAll({ date: today }),
        tokensAPI.getAll({ date: today }),
        healthCheck().catch(() => ({ data: { ok: false } })),
      ]);

      const tokens = tokensRes.data.data || [];
      const activeTokens = tokens.filter(t => 
        ['booked', 'waitlist', 'checked_in', 'in_consultation'].includes(t.status)
      );

      setStats({
        doctors: doctorsRes.data.data?.length || 0,
        slots: slotsRes.data.data?.length || 0,
        tokens: tokens.length,
        activeTokens: activeTokens.length,
      });
      setHealth(healthRes.data.ok);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div>
          {health ? (
            <span className="badge badge-success">Backend Connected</span>
          ) : (
            <span className="badge badge-danger">Backend Disconnected</span>
          )}
        </div>
      </div>

      <div className="grid">
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <div className="value">{stats.doctors}</div>
        </div>
        <div className="stat-card">
          <h3>Today's Slots</h3>
          <div className="value">{stats.slots}</div>
        </div>
        <div className="stat-card">
          <h3>Total Tokens (Today)</h3>
          <div className="value">{stats.tokens}</div>
        </div>
        <div className="stat-card">
          <h3>Active Tokens</h3>
          <div className="value">{stats.activeTokens}</div>
        </div>
      </div>

      <div className="card">
        <h3>Quick Actions</h3>
        <p>Use the navigation menu to:</p>
        <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
          <li>Manage doctors and their default slots</li>
          <li>Generate slots for specific dates</li>
          <li>Create and manage tokens</li>
          <li>Run OPD day simulation</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
