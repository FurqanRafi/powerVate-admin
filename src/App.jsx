import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserDetailsPage from "./components/pages/UserDetailsPage";
import DoctorsDetailPage from "./components/pages/DoctorsDetailPage";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/user-details/:id" element={<UserDetailsPage />} />
        <Route path="/doctor-details/:id" element={<DoctorsDetailPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
