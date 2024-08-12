# SingleStore Data Connector

![Logo Image](docs/singlestore_logo_horizontal_color_on-white_rgb.png)

<!-- TODO: update when connector will be published -->
[![Docs](https://img.shields.io/badge/docs-v3.x-brightgreen.svg?style=flat)](https://hasura.io/docs/3.0/latest/connectors/singesltore/)
[![ndc-hub](https://img.shields.io/badge/ndc--hub-singlestore-blue.svg?style=flat)](https://hasura.io/connectors/singlestore)
[![License](https://img.shields.io/badge/license-Apache--2.0-purple.svg?style=flat)](LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-yellow.svg?style=flat)](./readme.md)

The Hasura SingleStore Connector allows for connecting to a SingleStore database to give you an instant GraphQL API on top of your data.

This connector is built using the [Typescript Data Connector SDK](https://github.com/hasura/ndc-sdk-typescript) and implements the [Data Connector Spec](https://github.com/hasura/ndc-spec).

<!-- TODO: update when connector will be published -->
- [Connector information in the Hasura Hub](https://hasura.io/connectors/singlestore)
- [Hasura V3 Documentation](https://hasura.io/docs/3.0)

<!-- TODO: add lincs to the documentation -->

## Features

Below, you'll find a matrix of all supported features for the SingleStore connector:

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

## Before you get Started

[Prerequisites or recommended steps before using the connector.]

1. The [DDN CLI](https://hasura.io/docs/3.0/cli/installation) and [Docker](https://docs.docker.com/engine/install/) installed
2. A [supergraph](https://hasura.io/docs/3.0/getting-started/init-supergraph)
3. A [subgraph](https://hasura.io/docs/3.0/getting-started/init-subgraph)
4. Have a [SingleStore](https://www.singlestore.com/) hosted database, or a locally running SingleStore database — for supplying data to your API.

The steps below explain how to Initialize and configure a connector for local development. You can learn how to deploy a
connector — after it's been configured — [here](https://hasura.io/docs/3.0/getting-started/deployment/deploy-a-connector).

## Using the SingleStore connector

<!-- TODO: test steps after the connector will be published to hub -->
### Step 1: Authenticate your CLI session

```bash
ddn auth login
```

### Step 2: Initialize the connector

```bash
ddn connector init singlestore  --subgraph my_subgraph/subgraph.yaml  --hub-connector hasura/singlestore
```

In the snippet above, we've used the subgraph `my_subgraph` as an example; however, you should change this
value to match any subgraph which you've created in your project.

### Step 3: Modify the connector's port

When you initialized your connector, the CLI generated a set of configuration files, including a Docker Compose file for
the connector. Typically, connectors default to port `8080`. Each time you add a connector, we recommend incrementing the published port by one to avoid port collisions.

As an example, if your connector's configuration is in `my_subgraph/connector/singlestore/compose.yaml`, you can modify the published port to
reflect a value that isn't currently being used by any other connectors:

```yaml
ports:
  - mode: ingress
    target: 8080
    published: "8082"
    protocol: tcp
```

### Step 4: Add environment variables

Now that our connector has been scaffolded out for us, we need to provide a connection string so that the data source can be introspected and the
boilerplate configuration can be taken care of by the CLI.

The CLI has provided an `.env.local` file for our connector in the `my_subgraph/connector/singlestore` directory. We can add a key-value pair
of `SINGLESTORE_URL` along with the connection string itself to this file, and our connector will use this to connect to our database.

The file, after adding the `SINGLESTORE_URL`, should look like this example:

```env
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://local.hasura.dev:4317
OTEL_SERVICE_NAME=my_subgraph_singlestore
SINGLESTORE_URL=mysql://user:pass@host/db
```
SingleStore connector uses [MySQL2](https://sidorares.github.io/node-mysql2/docs) library to establish connection.
The format of the `SINGELSTORE_URL` is `mysql://[<user>[:<password>]][@<host>:[<port>]]/[<database>][?<key1>=<value1>[&<key2>=<value2>]]`.
Check [Connection options](https://www.npmjs.com/package/mysql#connection-options) and [Pool options](https://www.npmjs.com/package/mysql#pool-options) for more information.

Alternatively, you can set following environment variables instead of `SINGELSTORE_URL`:
 * `SINGLESTORE_HOST` - the hostname of the database you are connecting to. (default: `localhost`)
 * `SINGLESTORE_PORT` - the port number to connect to. (default: `3306`)
 * `SINGLESTORE_USER` - the SingleStore user to authenticate as
 * `SINGLESTORE_PASSWORD` - the password of that SingleStore user
 * `SINGLESTORE_DATABASE` - name of the database to use
 * `SINGLESTORE_SSL_CA` - path to trusted CA certificates file
 * `SINGLESTORE_SSL_CERT` - path to cert chain file in PEM format
 * `SINGLESTORE_SSL_KEY` - path to private key file in PEM format
 * `SINGLESTORE_SSL_CIPHERS` - cipher suite specification, replacing the default
 * `SINGLESTORE_SSL_PASSPHRASE` - shared passphrase used for a single private key
 * `SINGLESTORE_SSL_REJECT_UNAUTHORIZED` - if true the server will reject any connection which is not authorized with the list of supplied CAs (default: `true`)

### Step 5: Introspect your data source

With the connector configured, we can now use the CLI to introspect our database and create a source-specific configuration file for our connector.

```bash
ddn connector introspect --connector my_subgraph/connector/singlestore/connector.local.yaml
```

### Step 6. Create the Hasura metadata

Hasura DDN uses a concept called "connector linking" to take [NDC-compliant](https://github.com/hasura/ndc-spec)
configuration JSON files for a data connector and transform them into an `hml` (Hasura Metadata Language) file as a
[`DataConnectorLink` metadata object](https://hasura.io/docs/3.0/supergraph-modeling/data-connectors#dataconnectorlink-dataconnectorlink).

Basically, metadata objects in `hml` files define our API.

First we need to create this `hml` file with the `connector-link add` command and then convert our configuration files
into `hml` syntax and add it to this file with the `connector-link update` command.

Let's name the `hml` file the same as our connector, `singlestore`:

```bash
ddn connector-link add singlestore --subgraph my_subgraph/subgraph.yaml
```

The new file is scaffolded out at `my_subgraph/metadata/singlestore/singlestore.hml`.

### Step 7. Update the environment variables

The generated file has two environment variables — one for reads and one for writes — that you'll need to add to your subgraph's `.env.my_subgraph.local` file.
Each key is prefixed by the subgraph name, an underscore, and the name of the connector. Ensure the port value matches what is published in your connector's docker compose file.

As an example:

```env
MY_SUBGRAPH_SINGLESTORE_READ_URL=http://local.hasura.dev:<port>
MY_SUBGRAPH_SINGLESTORE_WRITE_URL=http://local.hasura.dev:<port>
```

These values are for the connector itself and utilize `local.hasura.dev` to ensure proper resolution within the docker container.

### Step 8. Start the connector's Docker Compose

Let's start our connector's Docker Compose file by running the following from inside the connector's subgraph:

```bash
docker compose -f compose.yaml up
```

### Step 9. Update the new `DataConnectorLink` object

Finally, now that our `DataConnectorLink` has the correct environment variables configured for the connector,
we can run the update command to have the CLI look at the configuration JSON and transform it to reflect our database's
schema in `hml` format. In a new terminal tab, run:

```bash
ddn connector-link update singlestore --subgraph my_subgraph/subgraph.yaml --env-file my_subgraph/.env.my_subgraph.local
```

After this command runs, you can open your `my_subgraph/metadata/singlestore.hml` file and see your metadata completely
scaffolded out for you 🎉

### Step 10. Deploy your connector

Connectors can be deployed to Hasura DDN or, if you choose, your own infrastructure.

#### Deploy SingleStore to Hasura DDN

Prepare a `env.cloud` file for the connector. This should utilize whichever environment variables, such as a connection
string, you intend to use with your deployed supergraph. As an example:

```env
SINGLESTORE_URL=mysql://user:pass@host/db
```

Then, run the following command taking care to update the referenced paths to match your project structure:

```sh
ddn connector build create \
  --connector my_subgraph/connector/singlestore/connector.cloud.yaml \
  --target-env-file my_subgraph/.env.my_subgraph.cloud \
  --target-subgraph my_subgraph/subgraph.yaml \
  --target-connector-link singlestore
```

This will deploy your connector and update your project's metadata.

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

You'll need to follow whatever steps are necessary to expose your connector's port so that Hasura DDN can connect to it.
Additionally, you'll need to update any cloud environment variables that your deployed supergraph needs from this
connector (e.g., `MY_SUBGRAPH_SINGLESTORE_READ_URL`) to match your deployed connector's endpoint.

<!-- TODO: add lincs to the documentation
## Documentation

View the full documentation for the SingleStore connector [here](./docs/index.md).


## Contributing

Check out our [contributing guide](./docs/contributing.md) for more details.
-->

## License

The SingleStore connector is available under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
