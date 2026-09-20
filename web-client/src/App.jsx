import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import BackofficeDashboard from './pages/backoffice/BackofficeDashboard';
import ProsumerManagement from './pages/backoffice/ProsumerManagement';
import NodeManagement from './pages/backoffice/NodeManagement';
import OperatorDashboard from './pages/operator/OperatorDashboard';
import SlotManagement from './pages/operator/SlotManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Backoffice Admin Routes */}
              <Route
                path="/backoffice/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <BackofficeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/prosumers"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <ProsumerManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backoffice/nodes"
                element={
                  <ProtectedRoute allowedRoles={['Backoffice']}>
                    <NodeManagement />
                  </ProtectedRoute>
                }
              />

              {/* Grid Operator Routes */}
              <Route
                path="/operator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <OperatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operator/slots"
                element={
                  <ProtectedRoute allowedRoles={['GridOperator']}>
                    <SlotManagement />
                  </ProtectedRoute>
                }
              />

              {/* Fallback Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
