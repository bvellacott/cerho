module.exports = function (msg, causeE) {
  return new Error(`${causeE.message}: ${causeE.stack}\n ----------- CAUSES -----------\n${msg}`)
}
