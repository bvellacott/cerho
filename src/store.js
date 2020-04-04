import createStore from 'redux-zero'
import { applyMiddleware } from "redux-zero/middleware";
import { connect } from "redux-zero/devtools";

const createInitialState = () => ({
	subscriptions: {},
})

const configureStore = () => {
	const isDev = process.env.NODE_ENV === 'development'
	
	const initialState = createInitialState()
	const middlewares = (isDev && connect) ? applyMiddleware(connect(initialState)) : [];
	
	const store = createStore(
		initialState,
		middlewares,
	)
	
	return store
}

export default configureStore