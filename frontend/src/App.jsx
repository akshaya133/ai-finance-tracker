import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import ScannerPage from './pages/ScannerPage';
import InsightsPage from './pages/InsightsPage';
import ExportPage from './pages/ExportPage';
const Protected = ({children}) => { const {isAuthenticated,loading}=useAuth(); if(loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>; if(!isAuthenticated) return <Navigate to='/login'/>; return <><Navbar/>{children}</>; };
const Public = ({children}) => { const {isAuthenticated}=useAuth(); if(isAuthenticated) return <Navigate to='/dashboard'/>; return children; };
function App() { return <AuthProvider><BrowserRouter><Routes>
  <Route path='/login' element={<Public><Login/></Public>}/>
  <Route path='/register' element={<Public><Register/></Public>}/>
  <Route path='/dashboard' element={<Protected><DashboardPage/></Protected>}/>
  <Route path='/transactions' element={<Protected><TransactionsPage/></Protected>}/>
  <Route path='/scanner' element={<Protected><ScannerPage/></Protected>}/>
  <Route path='/insights' element={<Protected><InsightsPage/></Protected>}/>
  <Route path='/export' element={<Protected><ExportPage/></Protected>}/>
  <Route path='/' element={<Navigate to='/dashboard'/>}/>
  <Route path='*' element={<Navigate to='/dashboard'/>}/>
</Routes><ToastContainer position='top-right' autoClose={3000} theme='dark'/></BrowserRouter></AuthProvider>; }
export default App;
