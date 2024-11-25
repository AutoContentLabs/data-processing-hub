/**
 * src\events\eventDataCollectRequest.js
 */

const {
  logger,
  helper,
  errorCodes,
  sendLogRequest,
  fileWriter
} = require('@auto-content-labs/messaging');
const path = require('path');

/**
 * Saves the serialized data to a file.
 * @param {string} filePath - Path to the file.
 * @param {string} data - Data to be saved in the file.
 */
async function saveDataToFile(filePath, data) {
  try {
    await fileWriter(filePath, data);
    logger.info(`Data saved: ${filePath}`);
  } catch (error) {
    logger.error(`Error saving data to file: ${error.message}`, { error });
    throw error; // Re-throw the error to be handled in the main function
  }
}

/**
 * Saves the source log to a separate log file.
 * @param {string} filePath - Path to the log file.
 * @param {string} logData - Log data to be written.
 * @param {boolean} append - Whether to append to the file or overwrite it.
 */
async function saveSourceLog(filePath, logData, append = false) {
  try {
    await fileWriter(filePath, logData, append);
    logger.info(`Source info saved to: ${filePath}`);
  } catch (error) {
    logger.error(`Error saving source log: ${error.message}`, { error });
    throw error; // Re-throw the error to be handled in the main function
  }
}

/**
 * Handles data collection response events.
 * @param {Object} processedData - The processedData data source.
 * @param {Object} processedData.value - The incoming model data.
 * @param {Object} processedData.value.id - Unique identifier for the data.
 * @param {Object} processedData.value.data - The actual data (must be serialized to string).
 * @param {Object} processedData.value.timestamp - Timestamp of the message.
 * @param {Object} processedData.value.summary - Summary information about the data.
 */
async function eventDataCollectResponse(processedData) {
  const { value } = processedData;

  if (!value) {
    logger.error("No value found in the message");
    return;
  }

  const { id, data, timestamp, summary } = value;
  const { source, itemCount, dataFormat, processingTime } = summary;

  // Validate message format
  if (id && data && timestamp && summary) {
    try {
      // Serialize the data if it's an object
      const serializedData = typeof data === 'object' ? JSON.stringify(data) : data;

      // Define the path for the data file
      const dataFile = `${source}.${dataFormat}`;

      // Save main data to a file
      await saveDataToFile(path.join(__dirname, '../../files', dataFile), serializedData);

      // Save source information to a separate log file
      const sourceFile = `sources.csv`;
      const sourceLog = `${id}, ${source}\n`;
      await saveSourceLog(path.join(__dirname, '../../files/logs', sourceFile), sourceLog, true);

      // Additional data processing can be added here...

    } catch (error) {
      logger.error(`Data save error: ${error.message}`, { error });

      const errorMessage = errorCodes.DATA_FETCH_ERROR.message;
      await sendLogRequest({
        logId: helper.getCurrentTimestamp(),
        message: `${errorMessage}: ${error.message}`,
        level: "error",
        timestamp: helper.getCurrentTimestamp(),
      });
    }

  } else {
    const errorMessage = errorCodes.INVALID_MESSAGE_FORMAT.message;
    await sendLogRequest({
      logId: helper.getCurrentTimestamp(),
      message: errorMessage,
      level: "error",
      timestamp: helper.getCurrentTimestamp(),
    });
  }
}

module.exports = { eventDataCollectResponse };
