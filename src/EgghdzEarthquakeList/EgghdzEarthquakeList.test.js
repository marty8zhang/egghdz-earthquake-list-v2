import React from 'react';
import ReactDOM from 'react-dom';
import App from './EgghdzEarthquakeList';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<EgghdzEarthquakeList />, div);
  ReactDOM.unmountComponentAtNode(div);
});
