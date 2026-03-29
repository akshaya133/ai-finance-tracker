import React, { useState, useRef } from 'react';
import { scannerAPI, transactionAPI } from '../services/api';
import { toast } from 'react-toastify';
import api from '../services/api';

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  color: '#fff',
  outline: 'none',
};

const TABS = ['Text Scanner', 'Excel Import'];

const ScannerPage = () => {
  const [activeTab, setActiveTab] = useState('Text Scanner');

  // Text scanner state
  const [text, setText]               = useState('');
  const [result, setResult]           = useState(null);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [txType, setTxType]           = useState('expense');

  // Excel import state
  const fileRef                               = useRef(null);
  const [excelRows, setExcelRows]             = useState(null);
  const [headersDetected, setHeadersDetected] = useState(null);
  const [selectedRows, setSelectedRows]       = useState(new Set());
  const [importing, setImporting]             = useState(false);
  const [importDone, setImportDone]           = useState(false);
  const [editedRows, setEditedRows]           = useState({});

  // ── Text scanner ──
  const analyze = async () => {
    if (!text.trim()) return;
    setSaved(false);
    try {
      const r = await scannerAPI.scanText(text);
      const data = r.data;
      setResult(data);
      setAmount(data.extracted_amount ?? '');
      setDescription(text);
      setCategory(data.ai_category ?? '');
      setTxType('expense');
      toast.success('Analyzed!');
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error(`Scan failed: ${err.message}`);
    }
  };

  const saveTransaction = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await transactionAPI.create({
        amount: Number(amount),
        description: description || text,
        transaction_type: txType,
        category,
        date: new Date().toISOString(),
      });
      setSaved(true);
      toast.success('Transaction saved! Check your dashboard.');
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetText = () => {
    setText(''); setResult(null); setSaved(false);
    setAmount(''); setDescription(''); setCategory('');
  };

  // ── Excel import ──
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelRows(null);
    setImportDone(false);
    setEditedRows({});

    const formData = new FormData();
    formData.append('file', file);

    try {
      const r = await api.post('/scanner/excel-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExcelRows(r.data.transactions);
      setHeadersDetected(r.data.headers_detected);
      setSelectedRows(new Set(r.data.transactions.map((_, i) => i)));
      toast.success(`Found ${r.data.total_rows} transactions!`);
    } catch (err) {
      console.error('Excel parse failed:', err);
      toast.error(`Failed to parse file: ${err.response?.data?.detail || err.message}`);
    }
  };

  const toggleRow = (i) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === excelRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(excelRows.map((_, i) => i)));
    }
  };

  const editRow = (i, field, value) => {
    setEditedRows(prev => ({
      ...prev,
      [i]: { ...(prev[i] || {}), [field]: value },
    }));
  };

  const importSelected = async () => {
    if (selectedRows.size === 0) {
      toast.error('Select at least one transaction');
      return;
    }
    setImporting(true);
    try {
      const toSave = [...selectedRows].map(i => ({
        ...excelRows[i],
        ...(editedRows[i] || {}),
      }));
      const r = await api.post('/scanner/excel-save', { transactions: toSave });
      setImportDone(true);
      toast.success(r.data.message);
    } catch (err) {
      console.error('Import failed:', err);
      toast.error(`Import failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const resetExcel = () => {
    setExcelRows(null);
    setHeadersDetected(null);
    setSelectedRows(new Set());
    setImportDone(false);
    setEditedRows({});
    if (fileRef.current) fileRef.current.value = '';
  };

  const confidenceColor = (c) => c >= 0.7 ? '#22c55e' : c >= 0.4 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 32 }}>AI Scanner</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'gradient-bg' : ''}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: activeTab === tab ? undefined : 'rgba(255,255,255,0.05)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TEXT SCANNER TAB */}
      {activeTab === 'Text Scanner' && (
        <>
          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ marginBottom: 16 }}>Text Scanner</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Spent $250 at Starbucks for coffee"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={analyze} className="gradient-bg"
                style={{ padding: '12px 24px', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Analyze
              </button>
              {result && (
                <button onClick={resetText}
                  style={{ padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#9ca3af', background: 'transparent', cursor: 'pointer' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {result && (
            <div className="glass" style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 16 }}>{saved ? '✅ Saved to Transactions' : 'Review & Save'}</h2>

              <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 20 }}>
                <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>AI Analysis</p>
                <p>Category: <b style={{ color: '#a855f7' }}>{result.ai_category} ({(result.confidence * 100).toFixed(0)}%)</b></p>
                <p style={{ marginTop: 4 }}>Keywords: <span style={{ color: '#60a5fa' }}>{result.matched_keywords?.join(', ') || 'None'}</span></p>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Amount</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Description</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Category</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Type</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['expense', 'income'].map((t) => (
                      <button key={t} onClick={() => setTxType(t)} style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none',
                        cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize',
                        background: txType === t ? (t === 'expense' ? '#ef4444' : '#22c55e') : 'rgba(255,255,255,0.05)',
                        color: '#fff',
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {!saved ? (
                <button onClick={saveTransaction} disabled={saving} className="gradient-bg"
                  style={{ marginTop: 24, padding: '12px 32px', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, width: '100%', fontSize: 16 }}>
                  {saving ? 'Saving...' : 'Save Transaction'}
                </button>
              ) : (
                <button onClick={resetText}
                  style={{ marginTop: 24, padding: '12px 32px', border: '1px solid #22c55e', borderRadius: 12, color: '#22c55e', fontWeight: 600, cursor: 'pointer', background: 'transparent', width: '100%', fontSize: 16 }}>
                  Scan Another
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* EXCEL IMPORT TAB */}
      {activeTab === 'Excel Import' && (
        <>
          <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ marginBottom: 8 }}>Excel / CSV Import</h2>
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              Upload a bank statement or transaction export. Supports .xlsx, .xls, and .csv files.
              The AI will auto-detect columns and categorize each transaction.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="gradient-bg"
              style={{ padding: '12px 28px', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}
            >
              📂 Choose File
            </button>

            {headersDetected && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 10, fontSize: 13, color: '#9ca3af' }}>
                <p style={{ marginBottom: 6, color: '#fff', fontWeight: 600 }}>Columns detected:</p>
                {Object.entries(headersDetected).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 16 }}>
                    <span style={{ color: '#a855f7' }}>{k}:</span> {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          {excelRows && (
            <div className="glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <h2>{importDone ? '✅ Import Complete' : `Preview — ${excelRows.length} rows found`}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleAll}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    {selectedRows.size === excelRows.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={resetExcel}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>
                    Clear
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>✓</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Amount</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Category</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelRows.map((row, i) => {
                      const edited = editedRows[i] || {};
                      const isSelected = selectedRows.has(i);
                      const currentType = edited.transaction_type ?? row.transaction_type;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: isSelected ? 1 : 0.4 }}>
                          <td style={{ padding: '6px' }}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleRow(i)} style={{ cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              value={edited.description ?? row.description}
                              onChange={(e) => editRow(i, 'description', e.target.value)}
                              style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: 13 }}
                            />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="number"
                              value={edited.amount ?? row.amount}
                              onChange={(e) => editRow(i, 'amount', e.target.value)}
                              style={{ background: 'transparent', border: 'none', color: '#22c55e', width: 80, outline: 'none', fontSize: 13 }}
                            />
                          </td>
                          <td style={{ padding: '6px', color: '#9ca3af' }}>
                            {(edited.date ?? row.date)?.split('T')[0]}
                          </td>
                          <td style={{ padding: '6px' }}>
                            <select
                              value={currentType}
                              onChange={(e) => editRow(i, 'transaction_type', e.target.value)}
                              style={{ background: '#1e1b4b', border: 'none', color: currentType === 'expense' ? '#ef4444' : '#22c55e', cursor: 'pointer', fontSize: 13 }}
                            >
                              <option value="expense">expense</option>
                              <option value="income">income</option>
                            </select>
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              value={edited.category ?? row.category}
                              onChange={(e) => editRow(i, 'category', e.target.value)}
                              style={{ background: 'transparent', border: 'none', color: '#a855f7', width: '100%', outline: 'none', fontSize: 13 }}
                            />
                          </td>
                          <td style={{ padding: '6px', color: confidenceColor(row.confidence) }}>
                            {(row.confidence * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!importDone ? (
                <button
                  onClick={importSelected}
                  disabled={importing || selectedRows.size === 0}
                  className="gradient-bg"
                  style={{
                    marginTop: 20, padding: '12px 32px', border: 'none',
                    borderRadius: 12, color: '#fff', fontWeight: 600,
                    fontSize: 16, width: '100%',
                    cursor: importing || selectedRows.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: importing || selectedRows.size === 0 ? 0.6 : 1,
                  }}
                >
                  {importing ? 'Importing...' : `Import ${selectedRows.size} Transactions`}
                </button>
              ) : (
                <button onClick={resetExcel}
                  style={{ marginTop: 20, padding: '12px 32px', border: '1px solid #22c55e', borderRadius: 12, color: '#22c55e', fontWeight: 600, cursor: 'pointer', background: 'transparent', width: '100%', fontSize: 16 }}>
                  Import Another File
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ScannerPage;