import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { NewSong } from './pages/NewSong';
import { Library } from './pages/Library';
import { SongDetailPage } from './pages/SongDetail';
import { Personas } from './pages/Personas';
import { Settings } from './pages/Settings';
import { API_BASE_URL } from './api/client';

function App() {
  const [systemStatus, setSystemStatus] = useState({
    healthy: false,
    message: 'Checking...',
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const isHealthy = healthResponse.ok;

        if (isHealthy) {
          setSystemStatus({
            healthy: true,
            message: `Web API online • Pipeline ready`,
          });
        } else {
          setSystemStatus({
            healthy: false,
            message: 'Backend offline',
          });
        }
      } catch (error) {
        setSystemStatus({
          healthy: false,
          message: 'Cannot connect',
        });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-dark-950 flex">
        {/* Sidebar */}
        <Sidebar systemStatus={systemStatus} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top navbar */}
          <Navbar />

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="animate-fadeIn">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/new" element={<NewSong />} />
                <Route path="/library" element={<Library />} />
                <Route path="/song/:songId" element={<SongDetailPage />} />
                <Route path="/personas" element={<Personas />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
