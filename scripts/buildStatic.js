const shell = require('shelljs')
const { join } = require('path')
const { ssrPaths = [] } = require(`${process.cwd()}/package.json`)

if (!shell.which('wget')) {
  shell.echo('Sorry, this script requires wget')
  shell.exit(1);
}

shell.echo('! remember to start the prod server before building !')

shell.rm('-rf', 'dist')
shell.mkdir('dist')
shell.cd('dist')
ssrPaths.forEach(path =>
  shell.exec(`wget -r -nH http://localhost:5000${path}`))
