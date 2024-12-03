const {
  logger,
  helper,
  errorCodes,
  sendLogRequest,
  handleDataCollectResponseRequest,
  fileWriter,
} = require("@auto-content-labs/messaging");
const nodePath = require("path");

async function saveFile(filePath, data, append = false) {
  try {
    await fileWriter(filePath, data, append);
    logger.info(`File saved: ${filePath}`);
  } catch (error) {
    logger.error(`File save error at ${filePath}: ${error.message}`);
    // Send log request on file save error
    // await sendLogRequest({
    //   logId: helper.getCurrentTimestamp(),
    //   message: `File save error: ${error.message}`,
    //   level: "error",
    //   timestamp: helper.getCurrentTimestamp(),
    // });
    throw error; // Re-throw the error to be handled by the main function
  }
}

/**
 * Handles data collection response events.
 * @param {Object} pair - The processedData data source.
 */
async function eventDataCollectResponse(pair) {
  const { key, value, headers } = pair;

  if (!value) {
    logger.error("No value found in the message");
    // await sendLogRequest({
    //   logId: helper.getCurrentTimestamp(),
    //   message: `No value found in the message`,
    //   level: "error",
    //   timestamp: helper.getCurrentTimestamp(),
    // });
    return;
  }

  const model = await handleDataCollectResponseRequest({ key, value, headers });

  const { id, service, content } = model;
  const {
    service_id,
    status_type_id,
    service_type_id,
    access_type_id,
    data_format_id,
    parameters,
    measurements,
  } = service;
  const { content_type, content_length, data } = content;
  const {
    protocol,
    domain,
    port,
    path,
    query_parameters,
    request_method,
    rate_limit,
    rate_limit_window,
    timeout,
    retry_count,
    cache_duration,
    cache_enabled,
    max_connections,
    api_key,
    logging_enabled,
    allowed_origins,
    error_handling,
    authentication_required,
    authentication_details,
    url,
  } = parameters;
  const {
    /*service_id,*/ metric_id,
    measurement_time,
    measurement_start_time,
    measurement_end_time,
    metric_type,
    metric_value,
  } = measurements;

  if (id && service && content) {
    try {
      // Serialize the data if it's an object
      const serializedData =
        typeof content.data === "object"
          ? JSON.stringify(content.data)
          : content.data;

      // Define the path for the data file with unique file names using the ID and timestamp
      const dataFile = `${domain}_${content_type}_${id}.json`;
      const dataFilePath = nodePath.join(
        __dirname,
        "../../files/sites",
        dataFile
      );

      // Save main data to a file
      await saveFile(dataFilePath, serializedData);

      // Save source information to a separate log file
      const title = data[0]?.title?.trim() || "No Title";
      const headings = data[0]?.headings[0]?.trim() || "No Heading";
      const paragraphs = data[0]?.paragraphs[0]?.trim() || "No Paragraph";

      const sourceFile = "sources.csv";
      const sourceLog = `"${id}","${domain}","${title}","${headings}","${paragraphs}"\n`;

      // Ensure source file is appended
      const sourceFilePath = nodePath.join(
        __dirname,
        "../../files/sources",
        sourceFile
      );
      await saveFile(sourceFilePath, sourceLog, true);

      logger.notice(
        `[dph] [${id}] ${headers.correlationId} count: ${content_length} content: ${content_type} domain: ${domain} `
      );
    } catch (error) {
      logger.error(
        `[eventDataCollectResponse] Error processing data: ${error.message}`
      );
      // Send the data collection request
      const providedHeaders = {
        correlationId: headers.correlationId,
        traceId: headers.traceId,
      }; // track before request
      // await sendLogRequest({
      //   logId: helper.getCurrentTimestamp(),
      //   message: `Error processing data: ${error.message}`,
      //   level: "error",
      //   timestamp: helper.getCurrentTimestamp(),
      // });
    }
  } else {
    const errorMessage = errorCodes.INVALID_MESSAGE_FORMAT.message;
    logger.error(errorMessage);
    // Send the data collection request
    const providedHeaders = {
      correlationId: headers.correlationId,
      traceId: headers.traceId,
    }; // track before request
    // await sendLogRequest({
    //   logId: helper.getCurrentTimestamp(),
    //   message: errorMessage,
    //   level: "error",
    //   timestamp: helper.getCurrentTimestamp(),
    // });
  }
}

module.exports = { eventDataCollectResponse };
