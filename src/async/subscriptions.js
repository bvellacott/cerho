import {
  getCookie,
  setCookie,
} from '@/utils';
import {
  TYPES,
  setSubscriptionsSheet,
} from '@/actions/subscriptions'

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
    // {
    //   "access_token": "ya29.a0Adw1xeWTXDrqCKT7-W8Hz0ZaeVxvVI_ED5LIFydyhbVQQnnOESdsxsXeMTMK3cB1k9aRhM1mnqsmUSUiGyoL-uZojUA5a_6K_vIMCNASwbyPXFNbWKGptpEw_vVVEzrLQbNAo22316iLmc1oz00_2_dc_rexdDLcENU",
    //   "expires_in": 3599,
    //   "scope": "https://www.googleapis.com/auth/spreadsheets",
    //   "token_type": "Bearer"
    // }
    const responseJson = await response.json()
    const expiryDate = new Date(Date.now() + responseJson.expires_in * 1000 - 30)
    setCookie('Bearer', responseJson.access_token, expiryDate.toUTCString())
  }
}

export const loadSubscriptionsSheet = async ({ dispatch }, action) => {
  try {
    await authenticate()
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets/1qea5ecpnkVWNRM1nfAV9Zp7qElTrkTid4LAmt1ZntbI/values/ilmoittautuneet!A1:E16', {
      headers: {
        'Authorization': `Bearer ${getCookie('Bearer')}`,
      },
    })
    const sheet = await response.json()
    dispatch(setSubscriptionsSheet(sheet))
  } catch(e) {
    dispatch(setSubscriptionsSheet(mockSheet))
  }
}

export default [
  [TYPES.LOAD_SUBSCRIPTIONS_SHEET, loadSubscriptionsSheet],
]

const mockSheet = {
  "range": "ilmoittautuneet!A1:E16",
  "majorDimension": "ROWS",
  "values": [
    [
      "etunimi",
      "sukunimi",
      "email",
      "oma_kone",
      "#HEADER"
    ],
    [
      "Selim",
      "Vellacott",
      "selim.vellacott@outlook.com",
      "TRUE",
      "#RECORD"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ],
    [
      "",
      "",
      "",
      "FALSE"
    ]
  ]
}
