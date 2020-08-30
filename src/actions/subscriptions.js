import {
  getLocalStorage,
} from '@/utils';
import {
  maxSubscribers,
  getNextFreeRow,
  getCurrentUserHasSubscribed,
} from '@/selectors/subscriptions'

const spreadsheetId = '1qea5ecpnkVWNRM1nfAV9Zp7qElTrkTid4LAmt1ZntbI'
const dayInMilliseconds = 24 * 60 * 60 * 1000

export const authenticate = async () => {
  const bearer = getLocalStorage().getItem('Bearer')
  if (!bearer) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({
        client_secret: 'en308ib3OufXvHGiA5XP-C3x',
        grant_type: 'refresh_token',
        refresh_token: '1//0cnwWo9akW--QCgYIARAAGAwSNwF-L9IruWf7YVvuMn54ipiipA8D1VEHn7NKHvGciAiQv-h9YscYkR7wC2mYLgRfZkbuRhezVIY',
        client_id: '902534841986-dlb3ijv8t4r5er2vas21bc4pk7pqjf31.apps.googleusercontent.com'
      }),
    })
    const responseJson = await response.json()
    const expiryDate = new Date(Date.now() + responseJson.expires_in * 1000 - 30)
    getLocalStorage().setItem('Bearer', responseJson.access_token, expiryDate.toUTCString())
  }
}

export const clearBearerAndRefreshOnFail = async (f) => {
  try {
    return await f()
  } catch (e) {
    getLocalStorage().removeItem('Bearer')
    document.location.reload()
  }
}

export const loadSubscriptionsSheet = async () => {
  await authenticate()
  return clearBearerAndRefreshOnFail(async () => {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/ilmoittautuneet!A1:E${maxSubscribers + 1}`, {
      headers: {
        'Authorization': `Bearer ${getLocalStorage().getItem('Bearer')}`,
      },
    })
    if (!response.ok) { throw new Error('call failed') }
    const sheet = await response.json()
    return {
      subscriptions: {
        sheet,
      },
    }
  })
}

export const setFirstName = (state, firstName) => ({ firstName })
export const setLastName = (state, lastName) => ({ lastName })
export const setEmail = (state, email) => ({ email })
export const setOwnLaptop = (state, ownLaptop) => ({ ownLaptop })

export const subscribe = async (state, firstName, lastName, email, ownLaptop) => {
  await authenticate()
  return clearBearerAndRefreshOnFail(async () => {
    const expiryDate = new Date(Date.now() + (30 * dayInMilliseconds))
    getLocalStorage().setItem('subscription', JSON.stringify({
      firstName,
      lastName,
      email,
      ownLaptop,
    }), expiryDate.toUTCString())
    const newState = await loadSubscriptionsSheet()
    const nextFreeRow = getNextFreeRow(newState)
    const userHasSubscribed = getCurrentUserHasSubscribed(newState)
    if (nextFreeRow && !userHasSubscribed) {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getLocalStorage().getItem('Bearer')}`,
          'Content-Type': 'application/json'
        },
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
          valueInputOption: 'RAW',
          data: {
            range: `ilmoittautuneet!A${nextFreeRow}:D${nextFreeRow}`,
            majorDimension: 'ROWS',
            values: [[firstName, lastName, email, ownLaptop]],
          },
        }),
      })
      if (!response.ok) { throw new Error('call failed') }
      return await loadSubscriptionsSheet()
    }
  });
}

export const clearUserData = async () => {
  await authenticate()
  return clearBearerAndRefreshOnFail(async () => {
    getLocalStorage().removeItem('subscription')
    return {
      ...loadSubscriptionsSheet(),
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      ownLaptop: undefined,
    }
  });
}
