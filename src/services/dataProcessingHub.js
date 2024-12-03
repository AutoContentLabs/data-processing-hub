/**
 * @file src/services/dataProcessingHub.js
 * @description Data Processing Hub
 */

const {
  logger,
  events,
  listenMessage,
} = require("@auto-content-labs/messaging");
const {
  eventDataCollectResponse,
} = require("../events/eventDataCollectResponse");

global.tasksProcessed = 0;
global.startTime = null;

// Start the listener for data collection requests
async function start() {
  try {
    logger.info("Application starting...");

    // Start time for overall processing
    global.startTime = Date.now();

    // The event we will listen to.
    const eventName = events.dataCollectResponse;

    // // Listen to incoming data collection response with a non-blocking async callback
    // await listenMessage(eventName, (message) => {
    //   // Start the eventDataCollectResponse but do not await it (non-blocking)
    //   eventDataCollectResponse(message).catch((error) => {
    //     logger.error("Error processing event", error);
    //   });
    // });

    // Listen to incoming data collection response with a non-blocking async callback
    await listenMessage(eventName, eventDataCollectResponse);

    logger.info(`Listener started on event: ${eventName}`);
  } catch (error) {
    logger.error(`Application failed to start:${eventName}`, error);
  }
}

/**
 * Graceful shutdown handler for the application.
 */
function handleShutdown() {
  logger.info("Application shutting down...");
  process.exit(0);
}

// Listen for process signals for graceful shutdown
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

module.exports = { start };
