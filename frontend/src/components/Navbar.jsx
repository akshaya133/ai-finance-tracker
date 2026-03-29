import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const Navbar = () => {
  const { user, logout } = useAuth(); const loc = useLocation(); const nav = useNavigate();
  const items = [{p:'/dashboard',l:'Dashboard'},{p:'/transactions',l:'Transactions'},{p:'/scanner',l:'Scanner'},{p:'/insights',l:'Insights'},{p:'/export',l:'Export'}];
  return <nav className='glass' style={{borderBottom:'1px solid rgba(255,255,255,0.1)',position:'sticky',top:0,zIndex:50}}>
    <div style={{maxWidth:1200,margin:'0 auto',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <Link to='/dashboard' style={{fontSize:20,fontWeight:'bold',textDecoration:'none',color:'#6366f1'}}>FinanceAI</Link>
      <div style={{display:'flex',gap:4}}>{items.map(n=><Link key={n.p} to={n.p} className={loc.pathname===n.p?'gradient-bg':''} style={{padding:'8px 16px',borderRadius:8,textDecoration:'none',fontSize:14,color:loc.pathname===n.p?'#fff':'#9ca3af'}}>{n.l}</Link>)}</div>
      <div style={{display:'flex',alignItems:'center',gap:16}}><span style={{fontSize:14,color:'#9ca3af'}}>{user?.full_name||user?.username}</span>
        <button onClick={()=>{logout();nav('/login');}} style={{padding:'8px 16px',background:'rgba(239,68,68,0.2)',color:'#f87171',border:'none',borderRadius:8,cursor:'pointer'}}>Logout</button></div>
    </div></nav>;
};
export default Navbar;
