/**
 * Data processing hub
 * src\events\eventDataCollectResponse.js
 */

const {
  logger,
  helper,
  errorCodes,
  sendLogRequest,
  handleDataCollectResponseRequest,
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
 * @param {Object} pair - The processedData data source.
 * @param {Object} pair.value - The incoming model data.
 * @param {Object} pair.value.id - Unique identifier for the data.
 * @param {Object} pair.value.data - The actual data (must be serialized to string).
 * @param {Object} pair.value.timestamp - Timestamp of the message.
 * @param {Object} pair.value.summary - Summary information about the data.
 */
async function eventDataCollectResponse(pair) {

  const { key, value, headers } = pair
  if (!value) {
    logger.error("No value found in the message");
    return;
  }

  const model = await handleDataCollectResponseRequest({ key, value, headers });
  // Determine the service type and handle parameters accordingly
  const { id, service, content } = model
  const { service_id, status_type_id, service_type_id, access_type_id, data_format_id, parameters, measurements } = service;
  const { content_type, content_length, data } = content;
  const { protocol, domain, port, path, query_parameters, request_method, rate_limit, rate_limit_window, timeout, retry_count, cache_duration, cache_enabled, max_connections, api_key, logging_enabled, allowed_origins, error_handling, authentication_required, authentication_details, url } = parameters;
  const { /*service_id,*/ metric_id, measurement_time, measurement_start_time, measurement_end_time, metric_type, metric_value } = measurements

  if (id && service && content) {
    try {
      // Serialize the data if it's an object
      const serializedData = typeof content.data === 'object' ? JSON.stringify(content.data) : content.data;

      // Define the path for the data file
      const dataFile = `${domain}.${content_type}`;

      // Save main data to a file
      await saveDataToFile(path.join(__dirname, '../../files', dataFile), serializedData);

      // Save source information to a separate log file
      const sourceFile = `sources.csv`;
      const sourceLog = `${id}, ${domain}\n`;
      await saveSourceLog(path.join(__dirname, '../../files/logs', sourceFile), sourceLog, true);

      logger.notice(`[dph] [${id}] ${headers.correlationId} domain: ${domain} content_length: ${content_length} content_type: ${content_type} ${metric_type}: ${metric_value}`);

    } catch (error) {
      logger.error(`Data save error: ${error.message}`, { error });

      const errorMessage = errorCodes.DATA_FETCH_ERROR.message;
      await sendLogRequest({
        logId: helper.getCurrentTimestamp(),
        message: `${errorMessage}: ${error.message}`,
        level: "error",
        timestamp: helper.getCurrentTimestamp(),
      }, headers.correlationId.toString());
    }

  } else {
    const errorMessage = errorCodes.INVALID_MESSAGE_FORMAT.message;
    await sendLogRequest({
      logId: helper.getCurrentTimestamp(),
      message: errorMessage,
      level: "error",
      timestamp: helper.getCurrentTimestamp(),
    }, headers.correlationId.toString());
  }
}

module.exports = { eventDataCollectResponse };
