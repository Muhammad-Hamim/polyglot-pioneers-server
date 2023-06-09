const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.PPA_USER}:${process.env.PPA_PASS}@cluster0.xmeadqe.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    const userCollection = client
      .db("polyglotPioneersAcademy")
      .collection("users");
    const classCollection = client
      .db("polyglotPioneersAcademy")
      .collection("classes");
    const instructorCollection = client
      .db("polyglotPioneersAcademy")
      .collection("instructors");

    // // jwt token varify
    // app.post("/jwt", (req, res) => {
    //   const user = req.body;
    //   const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
    //     expiresIn: "10h",
    //   });
    //   res.send({ token });
    // });
    // user collection api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Admin",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "Instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // classes apis
    app.get("/classes", async (req, res) => {
      const result = await classCollection.find().toArray();
      res.send(result);
    });
    //instructors api
    app.get("/instructors", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Polyglot Pioneers Academy!!");
});

app.listen(port, () => {
  console.log(`Polyglot Pioneers Academy is running on port ${port}`);
});
