/**
 * Returns the current timestamp in ISO format.
 * @returns {string} Current timestamp.
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

module.exports = { getCurrentTimestamp };
