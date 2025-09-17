import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import AlertsHub from './components/alerts/AlertsHub';
import AnalyticsHub from './components/analytics/AnalyticsHub';
import ReportsHub from './components/reports/ReportsHub';
import FormsHub from './components/forms/FormsHub';
import DirectoryHub from './components/directory/DirectoryHub';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="alerts" element={<AlertsHub />} />
          <Route path="analytics" element={<AnalyticsHub />} />
          <Route path="reports" element={<ReportsHub />} />
          <Route path="forms" element={<FormsHub />} />
          <Route path="directory" element={<DirectoryHub />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
