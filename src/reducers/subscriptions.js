import { TYPES } from '@/actions/subscriptions'

export const subscriptions =  (
  state = {},
  action
) => {
	switch(action.type) {
		case TYPES.SET_SUBSCRIPTIONS_SHEET:
			return {
        ...state,
        sheet: action.sheet,
      }
    default:
			return state
	}
}