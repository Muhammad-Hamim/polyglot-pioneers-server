const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
// middleware
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.status(401).send({ error: true, message: "unauthorized access" });
  }
  //bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      res.status(401).send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    // await client.connect();
    const userCollection = client
      .db("polyglotPioneersAcademy")
      .collection("users");
    const classCollection = client
      .db("polyglotPioneersAcademy")
      .collection("classes");
    const instructorCollection = client
      .db("polyglotPioneersAcademy")
      .collection("instructors");
    const selectedClassCollection = client
      .db("polyglotPioneersAcademy")
      .collection("selectedClass");

    //jwt api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "10h",
      });
      res.send({ token });
    });

    // user collection api
    app.get("/users", verifyJWT, async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving users:", error);
        res.status(500).send({ message: "Failed to retrieve users" });
      }
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
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      if (req.decoded.email !== email) {
        return res.send({ admin: false });
      }
      const user = await userCollection.findOne(query);
      const result = { admin: user?.role === "Admin" };
      console.log(result);
      res.send(result);
    });

    app.get("/users/instructors/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      if (req.decoded.email !== email) {
        return res.send({ instructor: false });
      }
      const user = await userCollection.findOne(query);
      const result = { instructor: user?.role === "Instructor" };
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
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    });

    // classes apis
    app.get("/classes", async (req, res) => {
      const instructorEmail = req.query.instructorEmail;
      try {
        let result;

        if (instructorEmail) {
          const query = { instructor_email: instructorEmail };
          result = await classCollection.find(query).toArray();
        } else {
          result = await classCollection.find().toArray();
        }
        res.send(result);
      } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).send({ message: "Failed to retrieve classes" });
      }
    });
    app.get("/classes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        result = await classCollection.findOne(filter);
        res.send(result);
      } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).send({ message: "Failed to retrieve classes" });
      }
    });

    app.post("/classes", async (req, res) => {
      const classInfo = req.body;
      const result = await classCollection.insertOne(classInfo);
      res.send(result);
    });

    app.patch("/classes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedInfo = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedInfo.title,
            image: updatedInfo.image,
            price: updatedInfo.price,
            available_seats: updatedInfo.available_seats,
            description: updatedInfo.description,
            status: updatedInfo.status,
          },
        };
        result = await classCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("Error retrieving classes:", error);
        res.status(500).send({ message: "Failed to retrieve classes" });
      }
    });

    app.patch("/classes/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "approve",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/classes/deny/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: "deny",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/classes/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const feedback = req.body.feedback;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedback,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //student selected class api
    app.get("/selectedclass", async (req, res) => {
      const studentEmail = req.query.studentEmail;
      const query = { stuEmail: studentEmail };
      const result = await selectedClassCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/selectedclass", async (req, res) => {
      const selectedClass = req.body;
      const result = await selectedClassCollection.insertOne(selectedClass);
      res.send(result);
    });
    app.delete("/selectedclass/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(filter);
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
