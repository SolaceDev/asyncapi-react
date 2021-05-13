import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';
import { createBrowserHistory } from 'history';

import Playground from './Playground';

import '@fortawesome/fontawesome-svg-core/styles.css';
import '@asyncapi/react-component/lib/styles/fiori.css';
import './common/icons';

import './index.css';

if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start();
}

const history = createBrowserHistory();

ReactDOM.render(
  <Router history={history}>
    <Switch>
      <Route exact path="/:maasId/:eapId" component={Playground} />
      <Route exact path="/:eapId" component={Playground} />
      <Route path="/" component={Playground} />
    </Switch>
  </Router>,
  document.getElementById('root'),
);
