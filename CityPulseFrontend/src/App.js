import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';
import Login from './Components/Login';
import Register from './Components/Register';
import UserProfile from './Components/UserProfile';

function App() {
  return (
    <div className='App'>
      <Router>
        {/* <header className='text-center py-3 bg-transparent text-white'>
          <h2>
            <b>
              <i>CityPulse</i>
            </b>
          </h2> 
        </header>*/}
        <Routes>
          <Route path='/home' element={<Home />} />
          <Route path='/' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/profile' element={<UserProfile />} />
        </Routes>
        <footer className='text-center py-3 bg-transparent text-white'>
          <small>&copy; 2025 CityPulse. All rights reserved.</small>
        </footer>
      </Router>
    </div>
  );
}

export default App;
