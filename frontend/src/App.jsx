import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ActivateAccount from "./pages/ActivateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MainLayout from "./components/MainLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Rules from "./pages/Rules/Rules";
import UserManagement from "./pages/UserManagement/UserManagement";
import Definitions from "./pages/Definitions";
import History from "./pages/History/History";
import SystemMetrics from "./pages/Dashboard/SystemMetrics";
import { useAuthStore } from "./store/useAuthStore";

const RootRedirect = () => {
  const { isAuthenticated, perfil } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (perfil === 'ADMIN') return <Navigate to="/users" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect users entering the root directly based on profile */}
        <Route path="/" element={<RootRedirect />} />

        {/* PUBLIC Routes (Without Header/Footer) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ativar" element={<ActivateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rotas PRIVADAS / COM LAYOUT (Com Header/Footer) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            
            {/* Rotas para GESTORES E UTILIZADORES */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'USER']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/historico" element={<History />} />
            </Route>

            {/* Rotas para GESTORES */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
              <Route path="/rules" element={<Rules />} />
            </Route>

            <Route path="/profile" element={<div className="text-center text-2xl mt-20">Página de Perfil (em construção)</div>} />

            {/* Rotas EXCLUSIVAS PARA ADMINISTRADORES */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UserManagement />} />
              <Route path="/definitions" element={<Definitions />} />
              <Route path="/admin/metrics" element={<SystemMetrics />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
