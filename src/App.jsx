import { Route, Navigate } from 'react-router-dom'
import PageFlip from './components/PageFlip'
import ReminderWatcher from './components/ReminderWatcher'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import Privacy from './pages/Privacy'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import More from './pages/More'
import ManageRoutine from './pages/ManageRoutine'
import Goals from './pages/Goals'
import Settings from './pages/Settings'
import Appearance from './pages/Appearance'
import Insights from './pages/Insights'
import Account from './pages/Account'
import Vault from './pages/Vault'
import Finance from './pages/Finance'
import FinanceSettings from './pages/FinanceSettings'
import Budgets from './pages/Budgets'
import Savings from './pages/Savings'
import SavingsGoal from './pages/SavingsGoal'
import Bills from './pages/Bills'

export default function App() {
  return (
    <>
      <ReminderWatcher />
      <PageFlip>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <More />
            </ProtectedRoute>
          }
        />
        <Route
          path="/routine"
          element={
            <ProtectedRoute>
              <ManageRoutine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appearance"
          element={
            <ProtectedRoute>
              <Appearance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <Vault />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money"
          element={
            <ProtectedRoute>
              <Finance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money/settings"
          element={
            <ProtectedRoute>
              <FinanceSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money/budgets"
          element={
            <ProtectedRoute>
              <Budgets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money/savings"
          element={
            <ProtectedRoute>
              <Savings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money/savings/:id"
          element={
            <ProtectedRoute>
              <SavingsGoal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/money/bills"
          element={
            <ProtectedRoute>
              <Bills />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </PageFlip>
    </>
  )
}