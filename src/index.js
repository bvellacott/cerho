import { h, render } from 'preact'
import { Provider } from 'preact-redux'
import App from '@/App';
import configureStore from '@/store'
import { getSubscriptions } from '@/actions/subscriptions'

import './index.scss';

render(<App />, document.body);

const init = () => {
  const [store, asyncContext] = configureStore()
  const Main = () => (
    <Provider
      store={store}
      asyncContext={asyncContext}
    >
      <App />
    </Provider>
  );
  
  store.dispatch(getSubscriptions())

  render(<Main />, document.body)
}

init()
