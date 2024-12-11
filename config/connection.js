const { MongoClient } = require('mongodb');
const state = {
    db: null,
};

module.exports.connect = async function (done) {
    const url = "mongodb://localhost:27017";
    const dbName = "shopping";

    try {
        console.log("Attempting to connect to MongoDB...");
        const client = new MongoClient(url); // New MongoClient instance
        await client.connect(); // Use async/await for cleaner connection handling
        state.db = client.db(dbName);
        done();
    } catch (err) {
        done(err);
    }
};

module.exports.get = function () {
    if (!state.db) {
        console.error("Database not initialized. Call connect() first.");
    }
    return state.db;
};
