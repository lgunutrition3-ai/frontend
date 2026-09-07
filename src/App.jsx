import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/common/Navbar'
import ProtectedRoute from './components/common/ProtectedRoute'
import Login from './pages/Login'
import SuperAdminLogin from './pages/SuperAdminLogin'
import Dashboard from './pages/Dashboard'
import AllRecords from './pages/AllRecords'
import BarangayReportLayout from './components/layout/BarangayReportLayout'
import OverallReportLayout from './components/layout/OverallReportLayout'
import AdminStaff from './pages/AdminStaff'
import SuperAdminDashboard from './pages/SuperAdminDashboard'

import StaffLayout from './components/layout/StaffLayout'
import ChildRecordsEntry from './components/staff/ChildRecordsEntry'
import AnimalRaisingEntry from './components/staff/AnimalRaisingEntry'
import PotableWaterEntry from './components/staff/PotableWaterEntry'
import IodizedSaltEntry from './components/staff/IodizedSaltEntry'
import CREntry from './components/staff/CREntry'
import BackyardGardeningEntry from './components/staff/BackyardGardeningEntry'
import PregnantWomenEntry from './components/staff/PregnantWomenEntry'
import VegetableSeedEntry from './components/staff/VegetableSeedEntry'
import AnimalDispersalEntry from './components/staff/AnimalDispersalEntry'

import Placeholder from './components/common/Placeholder'

import ChildRecordsReport from './components/reports/ChildRecordsReport'
import AnimalRaisingReport from './components/reports/AnimalRaisingReport'
import PotableWaterReport from './components/reports/PotableWaterReport'
import IodizedSaltReport from './components/reports/IodizedSaltReport'
import CRReport from './components/reports/CRReport'
import BackyardGardeningReport from './components/reports/BackyardGardeningReport'
import PregnantWomenReport from './components/reports/PregnantWomenReport'
import VegetableSeedReport from './components/reports/VegetableSeedReport'
import AnimalDispersalReport from './components/reports/AnimalDispersalReport'


import OverallChildRecordsReport from './components/overall-reports/OverallChildRecordsReport'
import OverallPregnantWomenReport from './components/overall-reports/OverallPregnantWomenReport'
import OverallAnimalRaisingReport from './components/overall-reports/OverallAnimalRaisingReport'
import OverallAnimalDispersalReport from './components/overall-reports/OverallAnimalDispersalReport'
import OverallBackyardGardeningReport from './components/overall-reports/OverallBackyardGardeningReport'
import OverallVegetableSeedReport from './components/overall-reports/OverallVegetableSeedReport'
import OverallPotableWaterReport from './components/overall-reports/OverallPotableWaterReport'
import OverallIodizedSaltReport from './components/overall-reports/OverallIodizedSaltReport'
import OverallCRReport from './components/overall-reports/OverallCRReport'



function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? (user.role === 'superadmin' ? <Navigate to="/superadmin" /> : <Navigate to="/dashboard" />) : <Login />
      } />
      <Route path="/superadmin/login" element={
        user ? (user.role === 'superadmin' ? <Navigate to="/superadmin" /> : <Navigate to="/dashboard" />) : <SuperAdminLogin />
      } />
      <Route path="/*" element={
        <div className="app-shell">
          <Navbar />
          <main>
            <Routes>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/barangay-report" element={
                <ProtectedRoute>
                  <BarangayReportLayout />
                </ProtectedRoute>
              }>
                <Route index element={<ChildRecordsReport />} />
                <Route path="pregnant-women" element={<PregnantWomenReport />} />
                <Route path="animal-raising" element={<AnimalRaisingReport />} />
                <Route path="animal-dispersal" element={<AnimalDispersalReport />} />
                <Route path="backyard-gardening" element={<BackyardGardeningReport />} />
                <Route path="vegetable-seeds" element={<VegetableSeedReport />} />
                <Route path="potable-water" element={<PotableWaterReport />} />
                <Route path="iodized-salt" element={<IodizedSaltReport />} />
                <Route path="cr" element={<CRReport />} />
              </Route>
             <Route path="/overall-report" element={
                <ProtectedRoute adminOnly>
                  <OverallReportLayout />
                </ProtectedRoute>
              }>
                <Route index element={<OverallChildRecordsReport />} />
                <Route path="pregnant-women" element={<OverallPregnantWomenReport />} />
                <Route path="animal-raising" element={<OverallAnimalRaisingReport />} />
                <Route path="animal-dispersal" element={<OverallAnimalDispersalReport />} />
                <Route path="backyard-gardening" element={<OverallBackyardGardeningReport />} />
                <Route path="vegetable-seeds" element={<OverallVegetableSeedReport />} />
                <Route path="potable-water" element={<OverallPotableWaterReport />} />
                <Route path="iodized-salt" element={<OverallIodizedSaltReport />} />
                <Route path="cr" element={<OverallCRReport />} />
              </Route>

              <Route path="/admin/records" element={
                <ProtectedRoute adminOnly>
                  <AllRecords />
                </ProtectedRoute>
              } />

              <Route path="/admin/staff" element={
                <ProtectedRoute adminOnly>
                  <AdminStaff />
                </ProtectedRoute>
              } />
              <Route path="/superadmin" element={
                <ProtectedRoute superadminOnly>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/staff" element={
                <ProtectedRoute staffOnly>
                  <StaffLayout />
                </ProtectedRoute>
              }>
                <Route path="child-records" element={<ChildRecordsEntry />} />
                <Route path="animal-raising" element={<AnimalRaisingEntry />} />
                <Route path="potable-water" element={<PotableWaterEntry />} />
                <Route path="iodized-salt" element={<IodizedSaltEntry />} />
                <Route path="cr" element={<CREntry />} />
                <Route path="backyard-gardening" element={<BackyardGardeningEntry />} />
                <Route path="pregnant-women" element={<PregnantWomenEntry />} />
                <Route path="vegetable-seeds" element={<VegetableSeedEntry />} />
                <Route path="animal-dispersal" element={<AnimalDispersalEntry />} />
                <Route path="" element={<Navigate to="/staff/child-records" />} />
              </Route>
              <Route path="/" element={<Navigate to={user?.role === 'superadmin' ? '/superadmin' : '/dashboard'} />} />
            </Routes>
          </main>
        </div>
      } />
    </Routes>
  )
}

export default App