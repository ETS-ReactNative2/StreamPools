import {Routes, Route} from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Streams from './components/Streams';
import Pools from './components/Pools';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navigation />
      <Routes >
        <Route path='/' element={<Home />} exact />
        <Route path='/streams' element={<Streams />} />
        <Route path='/pools' element={<Pools />} />
        <Route render={function () {
          return <p>Not found</p>
        }} />
      </Routes>
    </div>
  );
}

export default App;
