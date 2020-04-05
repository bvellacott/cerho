export const getWindow = () =>
  (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this;

export const getDocument = () => getWindow().document || {}

export const getLocalStorage = () => getWindow().localStorage || {
  getItem: () => {},
  setItem: () => {},
}

export const getCookie = name => (getDocument().cookie || '')
  .replace(new RegExp(`(?:(?:^|.*;\s*)${name}\s*\=\s*([^;]*).*$)|^.*$`), "$1")

export const setCookie = (name, value, expires) =>
  getDocument().cookie = `${name}=${value}; expires=${expires}`;
