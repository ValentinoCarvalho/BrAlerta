import React from 'react'; import ReactDOM from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css'; import './styles.css'; import App from './App'; import { IncidentsProvider } from './context/IncidentsContext';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><IncidentsProvider><App/></IncidentsProvider></BrowserRouter></React.StrictMode>);
