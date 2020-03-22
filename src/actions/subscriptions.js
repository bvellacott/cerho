export const TYPES = {
  LOAD_SUBSCRIPTIONS_SHEET: 'LOAD_SUBSCRIPTIONS_SHEET',
  SET_SUBSCRIPTIONS_SHEET: 'SET_SUBSCRIPTIONS_SHEET',
}

export const loadSubscriptionsSheet = () => ({
  type: TYPES.LOAD_SUBSCRIPTIONS_SHEET,
})

export const setSubscriptionsSheet = (sheet) => ({
  sheet,
  type: TYPES.SET_SUBSCRIPTIONS_SHEET,
})
