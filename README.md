# Data Processing Hub Service

Organizes the raw data sent by the data collection service according to the transformation rules. It organizes the transformed data and sends it to the data processing service via Kafka.

## Technologies Used
- **Kafka**: Receives signals and sends the processed data.
- **MySQL**: Administrative records (transformation rules)
- **MongoDB**: Raw data store
- **PostgreSQL**: Database where structured data is stored
- **Docker**: Enables the service to run in a container.