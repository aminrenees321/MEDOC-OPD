import React, { useState, useEffect } from 'react';
import { tokensAPI, slotsAPI, doctorsAPI } from '../services/api';

const SOURCE_COLORS = {
  emergency: 'badge-danger',
  priority: 'badge-warning',
  followup: 'badge-info',
  online: 'badge-success',
  walkin: 'badge-secondary',
};

const STATUS_COLORS = {
  booked: 'badge-success',
  waitlist: 'badge-warning',
  checked_in: 'badge-info',
  in_consultation: 'badge-info',
  completed: 'badge-secondary',
  cancelled: 'badge-danger',
  no_show: 'badge-danger',
};

function Tokens() {
  const [tokens, setTokens] = useState([]);
  const [slots, setSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [formData, setFormData] = useState({
    slotId: '',
    patientName: '',
    phone: '',
    source: 'online',
  });
  const [emergencyData, setEmergencyData] = useState({
    doctorId: '',
    date: new Date().toISOString().slice(0, 10),
    patientName: '',
    phone: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDoctors();
    loadSlots();
  }, [selectedDate]);

  useEffect(() => {
    loadTokens();
  }, [selectedDate, selectedSlot, selectedDoctor, selectedStatus]);

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
      const params = { date: selectedDate };
      const res = await slotsAPI.getAll(params);
      setSlots(res.data.data || []);
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const loadTokens = async () => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      if (selectedSlot) params.slotId = selectedSlot;
      if (selectedDoctor) params.doctorId = selectedDoctor;
      if (selectedStatus) params.status = selectedStatus;
      const res = await tokensAPI.getAll(params);
      setTokens(res.data.data || []);
    } catch (error) {
      setError('Failed to load tokens: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await tokensAPI.create(formData);
      setSuccess('Token created successfully!');
      setShowCreateModal(false);
      setFormData({ slotId: '', patientName: '', phone: '', source: 'online' });
      loadTokens();
      loadSlots();
    } catch (error) {
      setError('Failed to create token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEmergency = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await tokensAPI.emergency(emergencyData);
      setSuccess('Emergency token created successfully!');
      setShowEmergencyModal(false);
      setEmergencyData({
        doctorId: '',
        date: new Date().toISOString().slice(0, 10),
        patientName: '',
        phone: '',
        reason: '',
      });
      loadTokens();
      loadSlots();
    } catch (error) {
      setError('Failed to create emergency token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = async (tokenId) => {
    if (!window.confirm('Are you sure you want to cancel this token?')) return;
    try {
      const res = await tokensAPI.cancel(tokenId);
      if (res.data.data.promoted) {
        setSuccess('Token cancelled. Waitlist token promoted!');
      } else {
        setSuccess('Token cancelled successfully!');
      }
      loadTokens();
      loadSlots();
    } catch (error) {
      setError('Failed to cancel token: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleNoShow = async (tokenId) => {
    if (!window.confirm('Mark this token as no-show?')) return;
    try {
      const res = await tokensAPI.noShow(tokenId);
      if (res.data.data.promoted) {
        setSuccess('Token marked as no-show. Waitlist token promoted!');
      } else {
        setSuccess('Token marked as no-show!');
      }
      loadTokens();
      loadSlots();
    } catch (error) {
      setError('Failed to mark no-show: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading && tokens.length === 0) {
    return <div className="loading">Loading tokens...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Tokens</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-danger" onClick={() => setShowEmergencyModal(true)}>
            🚨 Emergency Token
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + Create Token
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
            <label>Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
            <label>Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="">All</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
            <label>Slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="">All</option>
              {slots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {slot.doctor?.name} {slot.startTime}-{slot.endTime}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 150px' }}>
            <label>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="booked">Booked</option>
              <option value="waitlist">Waitlist</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Sequence</th>
              <th>Patient Name</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Status</th>
              <th>Slot</th>
              <th>Priority Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tokens.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>No tokens found</td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token._id}>
                  <td>{token.sequenceInSlot || '-'}</td>
                  <td><strong>{token.patientName}</strong></td>
                  <td>{token.phone || '-'}</td>
                  <td>
                    <span className={`badge ${SOURCE_COLORS[token.source] || 'badge-secondary'}`}>
                      {token.source}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[token.status] || 'badge-secondary'}`}>
                      {token.status}
                    </span>
                  </td>
                  <td>
                    {token.slot ? (
                      `${token.slot.doctor?.name || 'N/A'} ${token.slot.startTime}-${token.slot.endTime}`
                    ) : '-'}
                  </td>
                  <td>{token.priorityScore}</td>
                  <td>
                    {token.status === 'booked' && (
                      <>
                        <button
                          className="btn btn-warning"
                          onClick={() => handleCancel(token._id)}
                          style={{ padding: '5px 10px', marginRight: '5px' }}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleNoShow(token._id)}
                          style={{ padding: '5px 10px' }}
                        >
                          No Show
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div className="modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Token</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Slot *</label>
                <select
                  required
                  value={formData.slotId}
                  onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                >
                  <option value="">Select Slot</option>
                  {slots.map((slot) => (
                    <option key={slot._id} value={slot._id}>
                      {slot.doctor?.name} - {slot.startTime}-{slot.endTime} ({new Date(slot.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Source *</label>
                <select
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="online">Online</option>
                  <option value="walkin">Walk-in</option>
                  <option value="priority">Priority</option>
                  <option value="followup">Follow-up</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEmergencyModal && (
        <div className="modal" onClick={() => setShowEmergencyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🚨 Emergency Token</h3>
              <button className="close-btn" onClick={() => setShowEmergencyModal(false)}>×</button>
            </div>
            <form onSubmit={handleEmergency}>
              <div className="form-group">
                <label>Doctor *</label>
                <select
                  required
                  value={emergencyData.doctorId}
                  onChange={(e) => setEmergencyData({ ...emergencyData, doctorId: e.target.value })}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc._id}>{doc.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={emergencyData.date}
                  onChange={(e) => setEmergencyData({ ...emergencyData, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Patient Name *</label>
                <input
                  type="text"
                  required
                  value={emergencyData.patientName}
                  onChange={(e) => setEmergencyData({ ...emergencyData, patientName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={emergencyData.phone}
                  onChange={(e) => setEmergencyData({ ...emergencyData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Emergency Reason</label>
                <textarea
                  value={emergencyData.reason}
                  onChange={(e) => setEmergencyData({ ...emergencyData, reason: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmergencyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">Create Emergency Token</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tokens;
