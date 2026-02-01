import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Workspaces from './pages/Workspaces';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/workspaces" element={<Workspaces />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
