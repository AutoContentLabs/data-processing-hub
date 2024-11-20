/**
 * @file src/app.js
 * @description Data Processing Hub
 */

const logger = require("@auto-content-labs/messaging/src/utils/logger")
const { events, eventHub, listenDataCollectResponse } = require('@auto-content-labs/messaging');
const { eventDataCollectResponse } = require("./events/eventDataCollectResponse")

async function start() {
    try {
        logger.info("Application starting...");

        // Start the listener for data collection response
        await listenDataCollectResponse()
        const eventName = events.dataCollectResponse
        logger.info(`Listener started on event: ${eventName}`);

        // events   
        eventHub.on(eventName, eventDataCollectResponse)

    } catch (error) {
        logger.error(`Application failed to start:${eventName}`, error);

    }
}

/**
 * Graceful shutdown handler for the application.
 */
function handleShutdown() {
    logger.info("Application shutting down...");
    // Add any necessary cleanup code here (e.g., close DB connections, stop listeners)
    process.exit(0);
}

// Listen for process signals for graceful shutdown
process.on("SIGINT", handleShutdown); // for Ctrl+C in terminal
process.on("SIGTERM", handleShutdown); // for termination signal

// Start the application
start();
