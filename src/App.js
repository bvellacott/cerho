import { h } from 'preact';
// import Logo from './logo.svg';
import { Paragraph } from '@/components/Paragraph'
import './App.scss';

function App({ path }) {
  const href = path === '/aapp.html' ? '/aapp/bapp.html' : '/aapp.html'
  return (
    <div className="App">
      <header className="App-header">
        {/* <div className="App-logo">
          <Logo />
        </div> */}
        <img src="/src/logo.svg" className="App-logo" alt="logo" />
        <Paragraph />
        <a className="App-link" href={href}>{href}</a>
      </header>
    </div>
  );
}

export default App;

