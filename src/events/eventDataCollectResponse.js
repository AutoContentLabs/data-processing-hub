/**
 * src\events\eventDataCollectRequest.js
 */

const {
  logger,
  helper,
  errorCodes
} = require('@auto-content-labs/messaging');
const fs = require('fs');

/**
 * Handles data collection response events.
 * @param {Object} processedData - The processedData data source.
 * @param {Object} processedData.key - The key in the data pair (optional).
 * @param {Object} processedData.value - The incoming model data
 * @param {Object} processedData.value.id
 * @param {Object} processedData.value.data
 * @param {Object} processedData.value.timestamp
 * @param {number} processedData.timestamp - Timestamp of the message.
 * @param {number} processedData.headers - Headers of the message.
 */
async function eventDataCollectResponse({ value } = processedData) {
  if (!value) {
    logger.error("No value found in the message");
    return;
  }

  // Validate message format
  if (value.id && value.data) {
    try {

      const file = () => {
        let fileName = `${value.id}.html`
        return `files/${fileName}`
      }

      await fs.writeFileSync(file, value.data);
      logger.info(`Data saved :  ${file}`);

      // start data processing?

    } catch (error) {
      logger.error(`Data saved error:  ${error}`);

      const errorMessage = errorCodes.DATA_FETCH_ERROR.message;
      await sendLogRequest({
        logId: helper.getCurrentTimestamp(),
        message: `${errorMessage}: ${error.message}`,
        level: "error",
        timestamp: helper.getCurrentTimestamp(),
      });

    }

  } else {

    await sendLogRequest({
      logId: getCurrentTimestamp(),
      message: errorCodes.INVALID_MESSAGE_FORMAT.message,
      level: "error",
      timestamp: getCurrentTimestamp(),
    });
  }
}

module.exports = { eventDataCollectResponse };