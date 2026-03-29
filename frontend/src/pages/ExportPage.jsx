import React, { useState } from 'react';
import { exportAPI, downloadFile } from '../services/api';
import { toast } from 'react-toastify';
const ExportPage = () => {
  const [loading, setLoading] = useState({});
  const exp = async (type,fn,name) => { setLoading(l=>({...l,[type]:true})); try{const r=await fn();downloadFile(r.data,name);toast.success('Exported!');}catch{toast.error('Failed');}finally{setLoading(l=>({...l,[type]:false}));} };
  const ts = new Date().toISOString().slice(0,10);
  return <div style={{padding:24,maxWidth:800,margin:'0 auto'}}><h1 style={{fontSize:28,fontWeight:'bold',marginBottom:32}}>Export</h1>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:24}}>
      <div className='glass card-hover' style={{padding:24}}><h3>CSV Export</h3><p style={{color:'#9ca3af',fontSize:14,margin:'8px 0 24px'}}>All transactions as CSV</p>
        <button onClick={()=>exp('csv',()=>exportAPI.downloadCSV({}),'transactions_'+ts+'.csv')} disabled={loading.csv} style={{width:'100%',padding:12,background:'#3b82f6',border:'none',borderRadius:12,color:'#fff',fontWeight:600,cursor:'pointer'}}>{loading.csv?'...':'Download CSV'}</button></div>
      <div className='glass card-hover' style={{padding:24}}><h3>JSON Export</h3><p style={{color:'#9ca3af',fontSize:14,margin:'8px 0 24px'}}>Raw JSON backup</p>
        <button onClick={()=>exp('json',()=>exportAPI.downloadJSON({}),'backup_'+ts+'.json')} disabled={loading.json} style={{width:'100%',padding:12,background:'#6b7280',border:'none',borderRadius:12,color:'#fff',fontWeight:600,cursor:'pointer'}}>{loading.json?'...':'Download JSON'}</button></div>
    </div></div>;
};
export default ExportPage;
