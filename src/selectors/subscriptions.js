import {
  getLocalStorage,
} from '@/utils';

export const maxPlaces = 15;
export const maxSubscribers = 100;

export const getSubscribers = (state) => {
  try {
    return state.subscriptions.sheet.values.slice(1).filter(
      ([firstName, lastName, email]) => (firstName && lastName && email),
    )
  } catch (e) {}
  return []
}

export const getNextFreeRow = (state) => {
  let nextFreeRow;
  const rows = state.subscriptions.sheet.values || []
  for (let i = 1; i < rows.length; i++) {
    const [first_name, last_name, email] = rows[i]
    if (first_name && last_name && email) {
      nextFreeRow = i + 2
    }
  }
  return nextFreeRow
}

export const getCurrentSubscription = () => {
  try {
    return JSON.parse(getLocalStorage().getItem('subscription')) || {}
  } catch (e) {
    return {}
  }
}

export const getCurrentUserHasSubscribed = (state) => {
  try {
    const { firstName, lastName, email } = getCurrentSubscription()
    return state.subscriptions.sheet.values.slice(1).find(
      ([fn, ln, em]) => firstName === fn && lastName === ln && email === em,
    )
  } catch (e) {
    return false
  }
}

export const getPlacesAvailable = (state) => maxPlaces - getSubscribers(state).length

export const getSubscriptionsAvailable = (state) => maxSubscribers - getSubscribers(state).length
