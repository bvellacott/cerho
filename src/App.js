import './reset.css'
import './base.css'
import './text-content.css'
import './forms.css'
import './content-sectioning.scss'
import './App.scss'

import { h, Fragment } from 'preact'
import { connect } from 'redux-zero/preact'

import {
  getCurrentSubscription,
  getCurrentUserHasSubscribed,
  getSubscribers,
  getPlacesAvailable,
  getSubscriptionsAvailable,
} from '@/selectors/subscriptions'

import {
  setFirstName,
  setLastName,
  setEmail,
  setOwnLaptop,
  subscribe,
  clearUserData,
} from '@/actions/subscriptions'

const mapStateToProps = (state) => ({
  firstName: state.firstName,
  lastName: state.lastName,
  email: state.email,
  ownLaptop: state.ownLaptop,
  subscription: getCurrentSubscription(),
  subscribers: getSubscribers(state),
  placesAvailable: getPlacesAvailable(state),
  subscriptionsAvailable: getSubscriptionsAvailable(state),
  userHasSubscribed: getCurrentUserHasSubscribed(state),
})

const mapActionsToProps = ({
  setFirstName,
  setLastName,
  setEmail,
  setOwnLaptop,
  subscribe,
  clearUserData,
})

function App({
  setFirstName,
  setLastName,
  setEmail,
  setOwnLaptop,
  firstName,
  lastName,
  email,
  ownLaptop,
  clearUserData,
  placesAvailable,
  subscribe,
  subscribers,
  subscriptionsAvailable,
  userHasSubscribed,
}) {
  const onSubmit = (e) => {
    e.preventDefault()
    subscribe(firstName, lastName, email, ownLaptop)
  }
  const onClearUserData = (e) => {
    e.preventDefault()
    clearUserData();
  }
  return (
    <div className="App">
      <main>
        <img src="/src/logo.svg" className="App-logo" alt="logo" />
        {userHasSubscribed && (
          <>
            <h1>Lielahden kirkon koodaus kerho</h1>
            <h2>Ti. 7.4.2020</h2>
            <h2>Klo. 18:00</h2>
            <h2>Kiitos osallistumisestasi {firstName}!</h2>
            <form onSubmit={onClearUserData}>
              <button>Ilmoita kaverisikin</button>
            </form>
          </>
        )}
        {!userHasSubscribed && !subscriptionsAvailable && (
          <>
            <h1>Lielahden kirkon koodaus kerho</h1>
            <h2>Ti. 7.4.2020</h2>
            <h2>Klo. 18:00</h2>
            <h2>Valitettavasti emme ota enää ilmoittautumisia vastaan</h2>
          </>
        )}
        {!userHasSubscribed && !!subscriptionsAvailable && (
          <>
            <h1>Ilmoittaudu Lielahden kirkon koodaus kerhoon</h1>
            <h2>Ti. 7.4.2020</h2>
            <h2>Klo. 18:00</h2>
            <h2>Ilmoittautuneita: {subscribers.length}</h2>
            <h2>Vapaita paikkoja: {placesAvailable}</h2>
            {!placesAvailable && (
              <p>
                Voit vielä ilmoittautua, vaikka paikkoja ei olekaan enää vapaana. 
                Jos joku luopuu paikastaan, pyydämme seuraavaa ilmoittautunutta hänen tilalleen.
              </p>
            )}
            <form onSubmit={onSubmit}>
              <label for="first-name">Etunimi
                <input id="first-name" type="text" value={firstName} onChange={({ target }) => setFirstName('sdfsdf')} />
              </label>
              <label for="last-name">Sukunimi
                <input id="last-name" type="text" value={lastName} onChange={({ target }) => setLastName(target.value)} />
              </label>
              <label for="email">Sähkoposti
                <input id="email" type="email" value={email} onChange={({ target }) => setEmail(target.value)} />
              </label>
              <label for="own-laptop">
                <span><input id="own-laptop" type="checkbox" value={ownLaptop} onChange={({ target }) => setOwnLaptop(target.value)} /> Oma läppäri</span>
              </label>
              <button>Ilmoittaudu</button>
            </form>
            <p>Kaikki yli seitsemäm vuotiaat ovat tervetulleita ja tavoitteena on saada kerhoon noin kymmen lasta sekä viisi aikuista.</p>
            <p>Keskitymme JavaScript kielen opetteluun, mutta tunnit räätälöidään jokaiselle taitotason ja kiinnostuksen kohteiden mukaan</p>
            <p>Voit tuoda oman koneen mukaan ja kerholla on kymmenen läppäriä käytettävissä jotka saa viedä kotiin mukaan 20€ panttia vastaan.</p>
          </>
        )}
      </main>
      <footer/>
    </div>
  );
}

export default connect(mapStateToProps, mapActionsToProps)(App);
