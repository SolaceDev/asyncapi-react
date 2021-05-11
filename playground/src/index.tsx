import React from 'react';
import ReactDOM from 'react-dom';

import Playground from './Playground';

import '@fortawesome/fontawesome-svg-core/styles.css';
import '@asyncapi/react-component/lib/styles/fiori.css';
import './common/icons';

if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start();
}

ReactDOM.render(<Playground />, document.getElementById('root'));
