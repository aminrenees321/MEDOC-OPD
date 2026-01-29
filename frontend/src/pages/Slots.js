import React, { useState, useEffect } from 'react';
import { slotsAPI, doctorsAPI, tokensAPI } from '../services/api';

function Slots() {
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slotTokens, setSlotTokens] = useState({});

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [selectedDate, selectedDoctor]);

  const loadDoctors = async () => {
    try {
      const res = await doctorsAPI.getAll();
      setDoctors(res.data.data || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
    }
  };

  const loadSlots = async () => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      if (selectedDoctor) params.doctorId = selectedDoctor;
      const res = await slotsAPI.getAll(params);
      setSlots(res.data.data || []);
      
      // Load token counts for each slot
      const tokenCounts = {};
      for (const slot of res.data.data || []) {
        try {
          const tokensRes = await tokensAPI.getAll({ slotId: slot._id });
          const tokens = tokensRes.data.data || [];
          const active = tokens.filter(t => 
            ['booked', 'waitlist', 'checked_in', 'in_consultation'].includes(t.status)
          );
          tokenCounts[slot._id] = {
            total: tokens.length,
            active: active.length,
            waitlist: tokens.filter(t => t.status === 'waitlist').length,
          };
        } catch (e) {
          console.error('Failed to load tokens for slot:', e);
        }
      }
      setSlotTokens(tokenCounts);
    } catch (error) {
      setError('Failed to load slots: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setSuccess('');
    try {
      const data = { date: selectedDate };
      if (selectedDoctor) data.doctorId = selectedDoctor;
      await slotsAPI.generate(data);
      setSuccess('Slots generated successfully!');
      loadSlots();
    } catch (error) {
      setError('Failed to generate slots: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading && slots.length === 0) {
    return <div className="loading">Loading slots...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Slots</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label>Doctor (Optional)</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleGenerate}>
              Generate Slots
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Time</th>
              <th>Date</th>
              <th>Capacity</th>
              <th>Active Tokens</th>
              <th>Waitlist</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No slots found. Generate slots for the selected date.</td>
              </tr>
            ) : (
              slots.map((slot) => {
                const tokens = slotTokens[slot._id] || { active: 0, waitlist: 0, total: 0 };
                const isFull = tokens.active >= slot.maxCapacity;
                return (
                  <tr key={slot._id}>
                    <td><strong>{slot.doctor?.name || 'N/A'}</strong></td>
                    <td>{slot.startTime} - {slot.endTime}</td>
                    <td>{new Date(slot.date).toLocaleDateString()}</td>
                    <td>{slot.maxCapacity}</td>
                    <td>{tokens.active}</td>
                    <td>{tokens.waitlist}</td>
                    <td>
                      {isFull ? (
                        <span className="badge badge-danger">Full</span>
                      ) : (
                        <span className="badge badge-success">Available</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Slots;
