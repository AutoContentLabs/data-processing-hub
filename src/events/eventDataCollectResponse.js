/**
 * src\events\eventDataCollectRequest.js
 */

const {
  logger,
  helper,
  errorCodes,
  sendLogRequest
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

  const { id, data, timestamp, summary } = value;
  const { source, itemCount, dataFormat, processingTime } = summary;

  // Validate message format
  if (id && data && timestamp && summary) {
    try {
      // Save main data to a file
      const dataFile = () => {
        let fileName = `${id}.${source}.${dataFormat}`;
        return `files/${fileName}`;
      };

      await fs.writeFileSync(dataFile(), data);
      logger.info(`Data saved: ${dataFile()}`);

      // Save source information to a separate file
      const sourceFile = () => `files/sources.log`;

      const sourceLog = `${id}, ${source}, ${new Date(timestamp).toISOString()}\n`;
      await fs.appendFileSync(sourceFile(), sourceLog);
      logger.info(`Source info saved to: ${sourceFile()}`);

      // Start data processing?

    } catch (error) {
      logger.error(`Data save error: ${error}`);

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
