import { h } from 'preact'
import render from 'preact-render-to-string';
import App from './App';

export default (req, res) => render(
  <html>
  <head>
    <title>Aapp</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="stylesheet" href="/src/index.jscss" />
  </head>
  <body>
    <h1>{req.path}</h1>
    <App path={req.path} />
    <script>
      {`window.process = {env: {NODE_ENV: '${process.env.NODE_ENV}'}}`}
    </script>
    <script src="/src/index.js"></script>
  </body>
</html>);
