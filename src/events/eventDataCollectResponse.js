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
const nodePath = require('path');

async function saveFile(filePath, data, append = false) {
  try {
    await fileWriter(filePath, data, append);
    logger.info(`File saved: ${filePath}`);
  } catch (error) {
    logger.error(`File save: ${filePath} ${error} - ${error.message}`);
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
      const dataFile = `${domain}.${content_type}.json`;

      // Save main data to a file
      await saveFile(nodePath.join(__dirname, '../../files', dataFile), serializedData);

      // Save source information to a separate log file
      const title = data[0]?.title;
      const trimmedTitle = title.trim();
      const headings = data[0]?.headings[0];
      const trimmedHeading = headings.trim();
      const paragraphs = data[0]?.paragraphs[0];
      const trimmedParagraph = paragraphs.trim();
      const sourceFile = `sources.csv`;
      const sourceLog = `"${id}","${domain}","${trimmedTitle}","${trimmedHeading},"${trimmedParagraph}"\n`;
      await saveFile(nodePath.join(__dirname, '../../files/logs', sourceFile), sourceLog, true);

      logger.notice(`[dph] [${id}] ${headers.correlationId} count: ${content_length} content: ${content_type} ${metric_type}: ${metric_value} domain: ${domain} `);

    } catch (error) {
      logger.error(`[eventDataCollectResponse] ${error}`);

      const errorMessage = errorCodes.DATA_FETCH_ERROR.message;
      // await sendLogRequest({
      //   logId: helper.getCurrentTimestamp(),
      //   message: `${errorMessage}: ${error.message}`,
      //   level: "error",
      //   timestamp: helper.getCurrentTimestamp(),
      // }, headers.correlationId.toString());
    }

  } else {
    const errorMessage = errorCodes.INVALID_MESSAGE_FORMAT.message;
    console.log(errorMessage)
    // await sendLogRequest({
    //   logId: helper.getCurrentTimestamp(),
    //   message: errorMessage,
    //   level: "error",
    //   timestamp: helper.getCurrentTimestamp(),
    // }, headers.correlationId.toString());
  }
}

module.exports = { eventDataCollectResponse };
