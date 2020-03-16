import handlers from '.'

const callHandler = async ([matcher, handler], store, action, asyncContext) => {
  if (
      (typeof matcher === 'string' && matcher === action.type) ||
      (matcher && typeof matcher.test === 'function' && matcher.test(action.type))
    ) {
    try {
      await handler(store, action, asyncContext)
    } catch (err) {
      console.error(err)
    }
  }
} 

const createAsyncMiddleware = asyncContext => store => next => action => {
  next(action)
  handlers.forEach(handler => callHandler(handler, store, action, asyncContext))
}

export default createAsyncMiddleware
