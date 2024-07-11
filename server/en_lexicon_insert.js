const { MongoClient } = require("mongodb");
require("dotenv/config"); // have access to .env
const fs = require("fs");

const { DB_HOST, DB_PORT, DB_NAME } = process.env;
const URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const client = new MongoClient(URI);

async function run() {
  try {
    await client.connect();

    const database = client.db("lexiclean");
    const maps = database.collection("maps");

    const rawData = fs.readFileSync("en_lexicon.json");

    const doc = JSON.parse(rawData);
    const result = await maps.insertOne(doc[0]);

    console.log(
      `English lexicon was added to collection with the _id: ${result.insertedId}`
    );
  } finally {
    await client.close();
  }
}

run().catch(console.dir());
