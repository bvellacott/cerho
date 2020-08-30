import { h } from 'preact'
import render from 'preact-render-to-string';
import { Provider } from 'redux-zero/preact'

import configureStore from '@/store'

import App from './App';

export default (req, res) => {
  const store = configureStore()
  return render(
    <html>
    <head>
      <title>Cerho</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <link rel="stylesheet" href="src/index.jscss" />
    </head>
    <body>
      <Provider store={store}>
        <App path={req.path} />
      </Provider>
      <script>
        {`window.process = {env: {NODE_ENV: '${process.env.NODE_ENV}'}}`}
      </script>
      <script src="bequire.js" />
      <script src="src/index.js" />
    </body>
  </html>);
}
