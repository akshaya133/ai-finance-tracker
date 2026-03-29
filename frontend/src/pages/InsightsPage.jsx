import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI } from '../services/api';
import { toast } from 'react-toastify';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

const styles = {
  page:        { padding: 24, maxWidth: 1200, margin: '0 auto' },
  card:        { padding: 24, marginBottom: 24 },
  predBox:     { padding: 16, background: 'rgba(139,92,246,0.1)', borderRadius: 12, textAlign: 'center' },
  predAmount:  { fontSize: 28, fontWeight: 'bold', color: '#a855f7' },
  predLabel:   { color: '#9ca3af' },
  adviceGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 },
  adviceCard:  { padding: 16, background: 'rgba(99,102,241,0.1)', borderRadius: 12 },
  adviceText:  { fontSize: 14, color: '#d1d5db' },
  anomalyCard: { padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between' },
  anomalyAmt:  { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  anomalyReason: { fontSize: 12, color: '#9ca3af' },
  muted:       { color: '#6b7280' },
  mutedCenter: { color: '#6b7280', textAlign: 'center', padding: 32 },
};

const InsightsPage = () => {
  const [predictions, setPredictions] = useState(null);
  const [budgetAdvice, setBudgetAdvice] = useState(null);
  const [anomalies, setAnomalies]       = useState(null);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    try {
      const [predictionsRes, adviceRes, anomaliesRes] = await Promise.all([
        aiAPI.getPredictions(),
        aiAPI.getBudgetAdvice(),
        aiAPI.getAnomalies(),
      ]);
      setPredictions(predictionsRes.data);
      setBudgetAdvice(adviceRes.data);
      setAnomalies(anomaliesRes.data);
    } catch (err) {
      console.error('InsightsPage load failed:', err);
      toast.error(`Failed to load insights: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p>AI analyzing...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 32 }}>AI Insights</h1>

      {/* Predictions */}
      <div className="glass" style={styles.card}>
        <h2 style={{ marginBottom: 16 }}>Predictions</h2>
        {predictions?.predicted_spending > 0 ? (
          <div style={styles.predBox}>
            <p style={styles.predLabel}>Next Month</p>
            <p style={styles.predAmount}>{fmt(predictions.predicted_spending)}</p>
          </div>
        ) : (
          <p style={styles.muted}>{predictions?.message || 'Add more data'}</p>
        )}
      </div>

      {/* Budget Advice */}
      <div className="glass" style={styles.card}>
        <h2 style={{ marginBottom: 16 }}>Budget Advice</h2>
        <div style={styles.adviceGrid}>
          {budgetAdvice?.advice?.map((item) => (
            <div key={item.id ?? item.title} style={styles.adviceCard}>
              <h3>{item.title}</h3>
              <p style={styles.adviceText}>{item.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      <div className="glass" style={styles.card}>
        <h2 style={{ marginBottom: 16 }}>Anomalies</h2>
        {anomalies?.anomalies?.length > 0 ? (
          anomalies.anomalies.map((anomaly) => (
            <div key={anomaly.transaction.id} style={styles.anomalyCard}>
              <div>
                <p style={{ fontWeight: 600 }}>{anomaly.transaction.description}</p>
                <p style={styles.anomalyReason}>{anomaly.reasons.join(', ')}</p>
              </div>
              <p style={styles.anomalyAmt}>{fmt(anomaly.transaction.amount)}</p>
            </div>
          ))
        ) : (
          <p style={styles.mutedCenter}>No anomalies!</p>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;