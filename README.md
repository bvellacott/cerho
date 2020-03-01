# bundlerb

Bundles on the Fly

This is a base project with a custom bundler that uses only babel and postcss. It doesn't have a separate build process, but instead has an asset server which will serve all assets in the project bundling all the javascript and css upon request and caching the result. The actual app is minimal and copied from create react app. Also it uses preact instead of react since it is a tenth of the size.

## run dev

```bash
clone

npm i

npm start
```

browse to http://localhost:4000/aapp.html

## build

```bash
npm run start:prod

npm run build:static
```
