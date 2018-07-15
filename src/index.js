import React from 'react';
import ReactDOM from 'react-dom';
// import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import EgghdzEarthquakeList from './EgghdzEarthquakeList/EgghdzEarthquakeList';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<EgghdzEarthquakeList />, document.getElementById('egghdz-earthquake-list'));
registerServiceWorker();
