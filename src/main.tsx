import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css'; import './styles.css'; import App from './App'; import { IncidentsProvider } from './context/IncidentsContext'; import { AuthProvider } from './context/AuthContext';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><AuthProvider><IncidentsProvider><App/></IncidentsProvider></AuthProvider></BrowserRouter></React.StrictMode>);
