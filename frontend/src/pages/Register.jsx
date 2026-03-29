import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
const Register = () => {
  const [form, setForm] = useState({username:'',email:'',password:'',full_name:'',monthly_budget:0});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth(); const navigate = useNavigate();
  const submit = async (e) => { e.preventDefault(); setLoading(true); try { await register({...form,currency:'USD'}); toast.success('Created!'); navigate('/dashboard'); } catch(err) { toast.error(err.response?.data?.detail||'Failed'); } finally { setLoading(false); } };
  const s = {width:'100%',padding:'12px 16px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,color:'#fff',fontSize:16,outline:'none'};
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
    <div className='glass' style={{padding:32,width:'100%',maxWidth:400}}>
      <h1 style={{textAlign:'center',fontSize:28,marginBottom:32,color:'#6366f1'}}>Create Account</h1>
      <form onSubmit={submit}>
        <div style={{marginBottom:12}}><label style={{fontSize:14,color:'#d1d5db'}}>Full Name</label><input type='text' value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} style={s}/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:14,color:'#d1d5db'}}>Username</label><input type='text' value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={s} required/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:14,color:'#d1d5db'}}>Email</label><input type='email' value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={s} required/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:14,color:'#d1d5db'}}>Password</label><input type='password' value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={s} required/></div>
        <div style={{marginBottom:16}}><label style={{fontSize:14,color:'#d1d5db'}}>Monthly Budget ($)</label><input type='number' value={form.monthly_budget} onChange={e=>setForm({...form,monthly_budget:parseFloat(e.target.value)||0})} style={s}/></div>
        <button type='submit' disabled={loading} className='gradient-bg' style={{width:'100%',padding:12,border:'none',borderRadius:12,color:'#fff',fontWeight:600,cursor:'pointer'}}>{loading?'Creating...':'Register'}</button>
      </form>
      <p style={{textAlign:'center',color:'#9ca3af',marginTop:24}}>Have account? <Link to='/login' style={{color:'#6366f1'}}>Login</Link></p>
    </div></div>;
};
export default Register;
