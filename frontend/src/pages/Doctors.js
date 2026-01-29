import React, { useState, useEffect } from 'react';
import { doctorsAPI } from '../services/api';

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    defaultSlots: [{ startTime: '09:00', endTime: '10:00', maxCapacity: 5 }],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await doctorsAPI.getAll();
      setDoctors(res.data.data || []);
    } catch (error) {
      setError('Failed to load doctors: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await doctorsAPI.create(formData);
      setSuccess('Doctor created successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        defaultSlots: [{ startTime: '09:00', endTime: '10:00', maxCapacity: 5 }],
      });
      loadDoctors();
    } catch (error) {
      setError('Failed to create doctor: ' + (error.response?.data?.error || error.message));
    }
  };

  const addSlot = () => {
    setFormData({
      ...formData,
      defaultSlots: [...formData.defaultSlots, { startTime: '10:00', endTime: '11:00', maxCapacity: 5 }],
    });
  };

  const removeSlot = (index) => {
    setFormData({
      ...formData,
      defaultSlots: formData.defaultSlots.filter((_, i) => i !== index),
    });
  };

  const updateSlot = (index, field, value) => {
    const slots = [...formData.defaultSlots];
    slots[index][field] = value;
    setFormData({ ...formData, defaultSlots: slots });
  };

  if (loading) {
    return <div className="loading">Loading doctors...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Doctors</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Doctor
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Default Slots</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>No doctors found</td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td><strong>{doctor.name}</strong></td>
                  <td>
                    {doctor.defaultSlots?.map((slot, idx) => (
                      <span key={idx} className="badge badge-info" style={{ marginRight: '5px' }}>
                        {slot.startTime}-{slot.endTime} (Cap: {slot.maxCapacity})
                      </span>
                    ))}
                  </td>
                  <td>{new Date(doctor.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Doctor</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Doctor Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Default Slots</label>
                {formData.defaultSlots.map((slot, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Capacity"
                      value={slot.maxCapacity}
                      onChange={(e) => updateSlot(index, 'maxCapacity', parseInt(e.target.value))}
                      style={{ width: '100px' }}
                    />
                    {formData.defaultSlots.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeSlot(index)}
                        style={{ padding: '5px 10px' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-secondary" onClick={addSlot}>
                  + Add Slot
                </button>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;
