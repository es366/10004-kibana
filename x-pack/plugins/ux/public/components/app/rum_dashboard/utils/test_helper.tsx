/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { render as testLibRender } from '@testing-library/react';
import { CoreStart } from '@kbn/core/public';
import { of } from 'rxjs';
import { createMemoryHistory } from 'history';
import { Router } from '@kbn/shared-ux-router';
import { MemoryHistory } from 'history';
import { EuiThemeProvider } from '@kbn/kibana-react-plugin/common';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { UrlParamsProvider } from '../../../../context/url_params_context/url_params_context';

export const core = {
  http: {
    basePath: {
      prepend: jest.fn(),
    },
  },
  uiSettings: {
    get: (key: string) => true,
    get$: (key: string) => of(true),
  },
} as unknown as CoreStart;

export const render = (component: React.ReactNode, options: { customHistory: MemoryHistory }) => {
  const history = options?.customHistory ?? createMemoryHistory();

  history.location.key = 'TestKeyForTesting';

  return testLibRender(
    <Router history={history}>
      <KibanaContextProvider services={{ ...core }}>
        <UrlParamsProvider>
          <EuiThemeProvider>{component}</EuiThemeProvider>
        </UrlParamsProvider>
      </KibanaContextProvider>
    </Router>
  );
};
