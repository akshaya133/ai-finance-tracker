import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); setLoading(true); try { await login(form); toast.success('Welcome!'); navigate('/dashboard'); } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); } finally { setLoading(false); } };
  const s = {width:'100%',padding:'12px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#fff',fontSize:16,outline:'none'};
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div className='glass' style={{padding:32,width:'100%',maxWidth:400}}>
      <h1 style={{textAlign:'center',fontSize:28,marginBottom:8,color:'#6366f1'}}>AI Finance Tracker</h1>
      <p style={{textAlign:'center',color:'#9ca3af',marginBottom:32}}>Welcome back!</p>
      <form onSubmit={submit}>
        <div style={{marginBottom:16}}><label style={{display:'block',fontSize:14,color:'#d1d5db',marginBottom:6}}>Username</label><input type='text' value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={s} required/></div>
        <div style={{marginBottom:24}}><label style={{display:'block',fontSize:14,color:'#d1d5db',marginBottom:6}}>Password</label><input type='password' value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={s} required/></div>
        <button type='submit' disabled={loading} className='gradient-bg' style={{width:'100%',padding:12,border:'none',borderRadius:12,color:'#fff',fontSize:16,fontWeight:600,cursor:'pointer',opacity:loading?0.5:1}}>{loading?'Loading...':'Login'}</button>
      </form>
      <p style={{textAlign:'center',color:'#9ca3af',marginTop:24}}>No account? <Link to='/register' style={{color:'#6366f1'}}>Register</Link></p>
    </div></div>;
};
export default Login;
