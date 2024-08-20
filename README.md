# SingleStore Data Connector

![Logo Image](docs/singlestore_logo_horizontal_color_on-white_rgb.png)

<!-- TODO: update when connector will be published -->
[![Docs](https://img.shields.io/badge/docs-v3.x-brightgreen.svg?style=flat)](https://hasura.io/docs/3.0/latest/connectors/singesltore/)
[![ndc-hub](https://img.shields.io/badge/ndc--hub-singlestore-blue.svg?style=flat)](https://hasura.io/connectors/singlestore)
[![License](https://img.shields.io/badge/license-Apache--2.0-purple.svg?style=flat)](LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-yellow.svg?style=flat)](./readme.md)

The Hasura SingleStore Connector ("the connector") enables you to connect to a SingleStore database and gives instant access to a GraphQL API on top of your data.

This connector is built using the [Typescript Data Connector SDK](https://github.com/hasura/ndc-sdk-typescript) and, it implements the [Data Connector Spec](https://github.com/hasura/ndc-spec).

<!-- TODO: update when connector will be published -->
- [Connector information in the Hasura Hub](https://hasura.io/connectors/singlestore)
- [Hasura V3 Documentation](https://hasura.io/docs/3.0)

## Features

The following matrix lists the features supported by the Hasura SingleStore connector:

| Feature                         | Supported | Notes |
| ------------------------------- | --------- | ----- |
| Native Queries + Logical Models | ❌     |       |
| Simple Object Query             | ✅     |       |
| Filter / Search                 | ✅     |       |
| Simple Aggregation              | ✅     |       |
| Sort                            | ✅     |       |
| Paginate                        | ✅     |       |
| Table Relationships             | ✅     |       |
| Views                           | ✅     |       |
| Distinct                        | ✅     |       |
| Remote Relationships            | ✅     |       |
| Mutations                       | ❌     | coming soon       |

## Prerequisites

Ensure that the following prerequisites are met before using the connector:

1. Install [DDN CLI](https://hasura.io/docs/3.0/cli/installation) and [Docker](https://docs.docker.com/engine/install/).
2. A [supergraph](https://hasura.io/docs/3.0/getting-started/init-supergraph)
3. A [subgraph](https://hasura.io/docs/3.0/getting-started/init-subgraph)
4. An active [SingleStore](https://www.singlestore.com/) deployment that serves as the data source for the API.


## Using the SingleStore connector

The following steps explain how to initialize and configure the connector for local developments. For information on deploying a connector after it has been configured, refer to [Deploy a Connector](https://hasura.io/docs/3.0/getting-started/deployment/deploy-a-connector).
<!-- TODO: test steps after the connector will be published to hub -->
### Step 1: Authenticate your CLI session

```bash
ddn auth login
```

### Step 2: Initialize the connector

```bash
ddn connector init singlestore  --subgraph my_subgraph/subgraph.yaml  --hub-connector hasura/singlestore
```

This command uses `my_subgraph` as an example. Update the `--subgraph` value in the command with the subgraph in your project. 

### Step 3: Modify the connector's port

When the connector is initialized (Step 2), the CLI generates a set of configuration files, including a Docker Compose file for the connector.
Typically, the default port of the connector is `8080`. To avoid port collisions, SingleStore recommends incrementing the published port by one whenever a new connector is added.

For example, you can modify the published port to a value that isn't currently being used by any other connector in the `compose.yaml` file (such as `my_subgraph/connector/singlestore/compose.yaml`):

```yaml
ports:
  - mode: ingress
    target: 8080
    published: "8082"
    protocol: tcp
```

### Step 4: Add environment variables

Now that the connector has been scaffolded out, provide a connection string that allows the connector to connect to the SingleStore database, introspect the data source, and generate boilerplate configuration.

During the initialization process, the CLI generates a `.env.local` file for the connector in the `<my_subgraph>/connector/singlestore` directory.
Specify the connection string used to connect to the SingleStore database using the `SINGLESTORE_URL` variable as a key-value pair in this file. The connection string must be in the `mysql://[<username>[:<password>]][@<host>:[<port>]]/[<database>][?<key1>=<value1>[&<key2>=<value2>]]` format. 

Here's a sample `.env.local` file after adding the `SINGLESTORE_URL` option:

```env
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://local.hasura.dev:4317
OTEL_SERVICE_NAME=my_subgraph_singlestore
SINGLESTORE_URL=singlestore://username:password@hostname/database
```
The connector uses [MySQL2](https://sidorares.github.io/node-mysql2/docs) library to establish a connection.
For more information, refer to [Connection options](https://www.npmjs.com/package/mysql#connection-options) and [Pool options](https://www.npmjs.com/package/mysql#pool-options).

Alternatively, you can also set following environment variables instead of the `SINGLELSTORE_URL` variable:
 * `SINGLESTORE_HOST` - Hostname of the SingleStore database to connect with. Default: `localhost`.
 * `SINGLESTORE_PORT` - Port number of the SingleStore database. Default: `3306`.
 * `SINGLESTORE_USER` - Username of the SingleStore database user used to authenticate the connection.
 * `SINGLESTORE_PASSWORD` - Password of the SingleStore database user.
 * `SINGLESTORE_DATABASE` - Name of the SingleStore database to connect with.
 * `SINGLESTORE_SSL_CA` - Path to the trusted CA certificate file.
 * `SINGLESTORE_SSL_CERT` - Path to the certificate chain file in PEM format.
 * `SINGLESTORE_SSL_KEY` - Path to the private key file in PEM format.
 * `SINGLESTORE_SSL_CIPHERS` - Cipher suite specification. If specified, it replaces the default value.
 * `SINGLESTORE_SSL_PASSPHRASE` - Shared passphrase used for a single private key.
 * `SINGLESTORE_SSL_REJECT_UNAUTHORIZED` - If enabled, the server rejects any connection that is not authorized with the list of supplied CAs. Default: `true`.

### Step 5: Introspect your data source

After configuring the connector, use the CLI to introspect the SingleStore database and create a source-specific configuration file for the connector.

```bash
ddn connector introspect --connector my_subgraph/connector/singlestore/connector.local.yaml
```

### Step 6. Create the Hasura metadata

Hasura DDN uses a concept called "connector linking" to take [NDC-compliant](https://github.com/hasura/ndc-spec)
configuration JSON files for a data connector and transform them into an `hml` (Hasura Metadata Language) file as a
[`DataConnectorLink` metadata object](https://hasura.io/docs/3.0/supergraph-modeling/data-connectors#dataconnectorlink-dataconnectorlink).

Basically, metadata objects in `hml` files define our API.

First we need to create this `hml` file with the `connector-link add` command, and then convert our configuration files
into `hml` syntax and add it to this file with the `connector-link update` command.

Let's name the `hml` file the same as our connector, `singlestore`:

```bash
ddn connector-link add singlestore --subgraph my_subgraph/subgraph.yaml
```

The new file is scaffolded out at `my_subgraph/metadata/singlestore/singlestore.hml`.

### Step 7. Update the environment variables

The generated file has two environment variables: one for reads and one for writes. Add these environment variables to your subgraph's `.env.my_subgraph.local` file.
Each key is prefixed by the subgraph name, an underscore, and the name of the connector. Ensure the port value matches the value published in the connector's docker compose file.

For example:

```env
MY_SUBGRAPH_SINGLESTORE_READ_URL=http://local.hasura.dev:<port>
MY_SUBGRAPH_SINGLESTORE_WRITE_URL=http://local.hasura.dev:<port>
```

These values are for the connector itself and utilize `local.hasura.dev` to ensure proper resolution within the docker container.

### Step 8. Start the connector's Docker Compose

Start the connector's Docker Compose file by running the following from inside the connector's subgraph:

```bash
docker compose -f compose.yaml up
```

### Step 9. Update the new `DataConnectorLink` object

Now that the `DataConnectorLink` has the correct environment variables configured for the connector,
run the `update` command to have the CLI look at the configuration JSON and transform it to reflect the database's
schema in `hml` format. In a new terminal tab, run:

```bash
ddn connector-link update singlestore --subgraph my_subgraph/subgraph.yaml --env-file my_subgraph/.env.my_subgraph.local
```

After this command runs, you can open your `my_subgraph/metadata/singlestore.hml` file and see your metadata completely
scaffolded out for you. 🎉

### Step 10. Deploy your connector

Connectors can be deployed to the Hasura DDN or, if you choose, your own infrastructure.

#### Deploy SingleStore to Hasura DDN

Prepare a `env.cloud` file for the connector. Use the environment variables of your choice, such as `SINGLESTORE_URL` 
, with the deployed supergraph. For example:

```env
SINGLESTORE_URL=mysql://user:pass@host/db
```

Then, update the referenced paths in the following command to match your project structure and run the updated command:

```sh
ddn connector build create \
  --connector my_subgraph/connector/singlestore/connector.cloud.yaml \
  --target-env-file my_subgraph/.env.my_subgraph.cloud \
  --target-subgraph my_subgraph/subgraph.yaml \
  --target-connector-link singlestore
```

This command deploys the connector and updates your project's metadata.

#### Deploy SingleStore to your own infrastructure

As a connector is an HTTP service built using Docker, you can host your connectors anywhere Docker containers can be
hosted.

On your own self- or cloud-hosted infrastructure, create a new build from within the connector's directory:

```sh
docker compose build
```

Then, bring the connector up:

```sh
docker compose up -d
```

And verify the connector is running:

```sh
docker ps
```

Perform the steps required to expose the connector's port so that Hasura DDN can connect to it.
Additionally, update any cloud environment variables that your deployed supergraph needs from the
connector (e.g., `MY_SUBGRAPH_SINGLESTORE_READ_URL`) to match the deployed connector's endpoint.

## License

The SingleStore connector is available under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
