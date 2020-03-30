export const getSubscribers = (state) => {
  try {
    return state.subscribers.sheet.values.slice(1).filter(
      ([first_name, last_name, email]) => console.log(first_name, last_name, email) || (first_name && last_name && email),
    )
  } catch (e) {}
  return []
}
