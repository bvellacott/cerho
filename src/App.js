import { h } from 'preact'
import './reset.css'
import './base.css'
import './text-content.css'
import './forms.css'
import './content-sectioning.scss'
import './App.scss'

function App({ path }) {
  return (
    <div className="App">
      <main>
        <img src="/src/logo.svg" className="App-logo" alt="logo" />
        <h1>Ilmoittaudu Lielahden kirkon koodaus kerhoon</h1>
        <h2>Ti. 7.4.2020</h2>
        <h2>Klo. 18:00</h2>
        <form>
          <label for="first-name">Etunimi<input id="first-name" type="text" /></label>
          <label for="last-name">Sukunimi <input id="last-name" type="text" /></label>
          <label for="email">Sähkoposti <input id="email" type="email" /></label>
          <label for="own-laptop"><span><input id="own-laptop" type="checkbox" /> Oma läppäri</span></label>
          <button>Ilmoittaudu</button>
        </form>
        <p>Kaikki yli seitsemäm vuotiaat ovat tervetulleita ja tavoitteena on saada kerhoon noin kymmen lasta sekä viisi aikuista.</p>
        <p>Keskitymme JavaScript kielen opetteluun, mutta tunnit räätälöidään jokaiselle taitotason ja kiinnostuksen kohteiden mukaan</p>
        <p>Voit tuoda oman koneen mukaan ja kerholla on kymmenen läppäriä käytettävissä jotka saa viedä kotiin mukaan 20€ panttia vastaan.</p>
      </main>
      <footer/>
    </div>
  );
}

export default App;
