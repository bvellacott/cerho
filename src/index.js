import '@/setupGlobals'
import { h, render } from 'preact'
import { Provider } from 'redux-zero/preact'
import configureStore from '@/store'
import { bindActions } from "redux-zero/utils";
import App from '@/App';
import { loadSubscriptionsSheet } from '@/actions/subscriptions'

import './index.scss';

const init = () => {
  const store = configureStore()
  const Main = () => (
    <Provider store={store} >
      <App />
    </Provider>
  )
  
  const bound = bindActions({ loadSubscriptionsSheet }, store)
  console.log(bound)
  bound.loadSubscriptionsSheet()

  render(<Main />, document.body)
}

init()
