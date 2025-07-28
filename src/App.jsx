import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import Homepage from './components/Homepage/Homepage';
import Relay from './components/Relay/Relay';
import Sensor from './components/Sensor/Sensor';
import MicroController from './components/MicroController/MicroController';
import Feeder from './components/Feeder/Feeder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/homepage" element={<Homepage />} />
        <Route path="/relay" element={<Relay />} />
        <Route path="/sensor" element={<Sensor />} />
        <Route path="/microcontroller" element={<MicroController />} />
        <Route path="/feeder" element={<Feeder />} />
      </Routes>
    </Router>
  );
}

export default App;
