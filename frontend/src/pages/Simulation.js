import React, { useState } from 'react';
import { simulationAPI } from '../services/api';

function Simulation() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const handleRun = async () => {
    setRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await simulationAPI.run({ date });
      setResult(res.data.data);
    } catch (error) {
      setError('Simulation failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>OPD Day Simulation</h2>
      </div>

      <div className="card">
        <h3>Run Simulation</h3>
        <p style={{ marginBottom: '20px' }}>
          This simulation will create 3+ doctors, generate slots for a date, allocate tokens from multiple sources,
          simulate cancellations, no-shows, and emergency insertions.
        </p>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label>Simulation Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={running}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
          >
            {running ? 'Running...' : 'Run Simulation'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <>
          <div className="card">
            <h3>Simulation Summary</h3>
            <div className="grid">
              <div className="stat-card">
                <h3>Date</h3>
                <div className="value" style={{ fontSize: '20px' }}>{result.date}</div>
              </div>
              <div className="stat-card">
                <h3>Doctors</h3>
                <div className="value">{result.doctors?.length || 0}</div>
              </div>
              <div className="stat-card">
                <h3>Slots Generated</h3>
                <div className="value">{result.slotsCount || 0}</div>
              </div>
            </div>
          </div>

          {result.doctors && result.doctors.length > 0 && (
            <div className="card">
              <h3>Doctors</h3>
              <ul>
                {result.doctors.map((doc, idx) => (
                  <li key={idx} style={{ marginBottom: '5px' }}>
                    <strong>{doc.name}</strong> (ID: {doc.id})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.summary && result.summary.length > 0 && (
            <div className="card">
              <h3>Token Summary (by Status × Source)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {result.summary.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item._id.status}</td>
                      <td>{item._id.source}</td>
                      <td><strong>{item.count}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.log && result.log.length > 0 && (
            <div className="card">
              <h3>Simulation Events (Sample)</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.log.slice(0, 30).map((event, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className={`badge ${
                            event.action.includes('failed') ? 'badge-danger' :
                            event.action === 'emergency' ? 'badge-danger' :
                            event.action === 'cancel' || event.action === 'no_show' ? 'badge-warning' :
                            'badge-success'
                          }`}>
                            {event.action}
                          </span>
                        </td>
                        <td>
                          {event.source && <span>Source: {event.source}, </span>}
                          {event.slot && <span>Slot: {event.slot}, </span>}
                          {event.tokenId && <span>Token: {event.tokenId}, </span>}
                          {event.promoted && <span>Promoted: {event.promoted}, </span>}
                          {event.error && <span style={{ color: 'red' }}>Error: {event.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.tokensSample && result.tokensSample.length > 0 && (
            <div className="card">
              <h3>Sample Tokens</h3>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Slot</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tokensSample.map((token, idx) => (
                    <tr key={idx}>
                      <td>{token.patientName}</td>
                      <td>
                        <span className={`badge ${
                          token.source === 'emergency' ? 'badge-danger' :
                          token.source === 'priority' ? 'badge-warning' :
                          token.source === 'followup' ? 'badge-info' :
                          token.source === 'online' ? 'badge-success' :
                          'badge-secondary'
                        }`}>
                          {token.source}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          token.status === 'booked' ? 'badge-success' :
                          token.status === 'waitlist' ? 'badge-warning' :
                          token.status === 'cancelled' || token.status === 'no_show' ? 'badge-danger' :
                          'badge-secondary'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                      <td>{token.slot || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Simulation;
