/**
 * @file src/app.js
 * @description Data Processing Application 
 */

const clusterManager = require('./cluster/clusterManager');

// Start with clustering unless in production environment
const withCluster = process.env.NODE_ENV !== "production";  // true for non-production environments
clusterManager.start(withCluster);
