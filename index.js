const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");

app.use(express.json());
app.use(cors());
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bi1yihr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    // connect database with the collections
    const collegesCollection = client.db("campusBooker").collection("colleges");
    const userData = client.db("campusBooker").collection("users");

    app.get("/colleges", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || "";

        const query = {
          collegeName: { $regex: search, $options: "i" },
        };
        const cursor = collegesCollection
          .find(query)
          .collation({ locale: "en_US", numericOrdering: true })
          .limit(limit);
        const colleges = await cursor.toArray();
        res.send(colleges);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.get("/colleges/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await collegesCollection.findOne(query);

        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ error: "College not found" });
        }
      } catch (error) {
        console.error("Error fetching college details:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get("/users", async (req, res) => {
      const user = req.body;
      const result = await userData.find(user).toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userData.insertOne(user);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
