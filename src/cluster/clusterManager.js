const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { logger } = require('@auto-content-labs/messaging');
const dataProcessingHub = require('../services/dataProcessingHub');

function start(withCluster = process.env.NODE_ENV !== 'production') {
    if (withCluster) {
        if (cluster.isMaster) {
            logger.info(`Master process is starting...`);

            // Forking workers
            for (let i = 0; i < numCPUs; i++) {
                cluster.fork();
            }

            cluster.on('exit', (worker, code, signal) => {
                logger.notice(`Worker ${worker.process.pid} exited with code ${code} and signal ${signal}`);
                // Optionally, restart the worker if needed
            });
        } else {
            // Worker process
            dataProcessingHub.start();
        }
    } else {
        // Single process mode (for production or non-clustered environments)
        dataProcessingHub.start();
    }
}

module.exports = { start };
