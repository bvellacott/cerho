import '@/setupGlobals'
import { h, render } from 'preact'
import { Provider } from 'react-redux'
import configureStore from '@/store'
import App from '@/App';
import { loadSubscriptionsSheet } from '@/actions/subscriptions'

import './index.scss';

const init = () => {
  const [store, asyncContext] = configureStore()
  const Main = () => (
    <Provider
      store={store}
      asyncContext={asyncContext}
    >
      <App />
    </Provider>
  )
  
  store.dispatch(loadSubscriptionsSheet())

  render(<Main />, document.body)
}

init()
