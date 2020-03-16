import {
	createStore,
	combineReducers,
	applyMiddleware,
	compose,
} from 'redux'
import reducers from '@/reducers'
import createAsyncMiddleware from '@/async/middleware'
import {
	getWindow,
} from '@/utils'

const configureStore = () => {
	const isDev = process.env.NODE_ENV === 'development'
	
	const asyncContext = {}
	const asyncMiddleware = createAsyncMiddleware(asyncContext)
	const middleware = applyMiddleware(asyncMiddleware)
	
	let enhancer
	if (isDev) {
    const window = getWindow();
		const composeEnhancers =
			typeof window === 'object' &&
			window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
				window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
				}) : compose
	
		enhancer = composeEnhancers(
			middleware,
		)
	} else {
		enhancer = middleware
	}
	
	const store = createStore(
    // combineReducers(reducers),
    (state, action) => {},
		enhancer,
	)
	
	return [store, asyncContext]
}

export default configureStore