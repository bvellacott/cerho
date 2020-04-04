import {
  getCookie,
  setCookie,
} from '@/utils';

export const authenticate = async () => {
  const bearer = getCookie('Bearer')
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
        refresh_token: '1//03gjyyUjWk2DlCgYIARAAGAMSNwF-L9IrwQSSnXHtccaXosd55tSqRPDbMQcWbzEjyaOeHL8707zX6FM6otBivzF67I4FFpPeWhg',
        client_id: '902534841986-dlb3ijv8t4r5er2vas21bc4pk7pqjf31.apps.googleusercontent.com'
      }),
    })
    const responseJson = await response.json()
    const expiryDate = new Date(Date.now() + responseJson.expires_in * 1000 - 30)
    setCookie('Bearer', responseJson.access_token, expiryDate.toUTCString())
  }
}

export const loadSubscriptionsSheet = async () => {
  try {
    await authenticate()
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/1qea5ecpnkVWNRM1nfAV9Zp7qElTrkTid4LAmt1ZntbI/values/ilmoittautuneet!A1:E16', {
      headers: {
        'Authorization': `Bearer ${getCookie('Bearer')}`,
      },
    })
    const sheet = await response.json()
    return { subscriptions: { sheet } }
  } catch(e) {
    return { subscriptions: { sheet: mockSheet } }
  }
}