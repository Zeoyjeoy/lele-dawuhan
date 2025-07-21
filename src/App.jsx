import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Homepage from './components/Homepage/Homepage';
import Relay from './components/Relay/Relay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/relay" element={<Relay />} />
      </Routes>
    </Router>
  );
}

export default App;
