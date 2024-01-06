const express = require('express')
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express();

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tort7uo.mongodb.net/?retryWrites=true&w=majority`;
const stripe = require('stripe')('sk_test_51NtCtrF2ejzpUbVI0D61WSBe8TSrr08Hvibewlcu8LLfAHrmOjV8aXmPT2FXbfhMMgSzO4y2wV461Nk1A25EJ12T000CuL1UR1');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    const blogCollection = client.db('travelbug').collection('blog');
    const userCollection = client.db("travelbug").collection("users");
    const packageCollection = client.db("travelbug").collection("package");
    const paymentCollection = client.db('travelbug').collection('payments');
    const destinationCollection = client.db('travelbug').collection('destination');
    const reviewCollection = client.db('travelbug').collection('review');
    app.post('/payments', async (req, res) => {
      const payment = req.body;
      console.log(payment,'paymenttt')
      const result = await paymentCollection.insertOne(payment)
      res.send(result)
    })
    app.get('/blog', async (req, res) => {
      const search = req.query.search;
      console.log(search);
      const query = { title: { $regex: search, $options: 'i' } };
      console.log(req.query)
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      const blogs = await blogCollection.find(query).skip(skip).limit(limit).toArray();
      res.send(blogs);
    })
    app.get('/destinations', async (req, res) => {
      try {
        const destinations = await destinationCollection.find().toArray()
        console.log(destinations)
        res.json(destinations);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve destinations' });
      }
    });

    app.get('/allorder', async (req, res) => {
      try {
          
          const query = {};
          console.log('user mail', query)
  
          // Use toArray to convert the cursor to an array
          const transactions = await paymentCollection.find(query).toArray();
  
          if (transactions.length > 0) {
              res.json(transactions);
              console.log(transactions);
          } else {
              res.status(404).json({ error: 'User not found' });
          }
      } catch (error) {
          console.error('Error fetching user history', error);
          res.status(500).json({ error: 'Internal server error' });
      }
  });
    app.get('/package', async (req, res) => {

      const search = req.query.search;
      console.log(search);
      const query = { title: { $regex: search, $options: 'i' } };
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      const packages = await packageCollection.find(query).skip(skip).limit(limit).toArray();
      res.send(packages);
    })
    app.get('/reviews',async(req,res)=>{
      try{
        const result= await reviewCollection.find().limit(3).toArray();
        res.send(result)
      }
      
      catch (error) {
        res.status(500).send('Error fetching reviews');
      }
    })
    app.get('/totalblog', async (req, res) => {
      const result = await blogCollection.estimatedDocumentCount();
      res.send({ totalBlogs: result })
    })
    app.get('/totaluser', async (req, res) => {
      const result = await userCollection.estimatedDocumentCount()
      console.log(result)
      res.send({ totalUser: result })
    })
    app.get('/totalpackage', async (req, res) => {
      const result = await packageCollection.estimatedDocumentCount();
      console.log(result)
      res.send({ totalPackage: result })
    })
    app.get('/orders/:email', async (req, res) => {
      try {
          const userEmail = req.params.email;
          console.log(userEmail)
          const query = { user: userEmail };
          const transactions = await paymentCollection.find(query).toArray();

          console.log('hey',transactions)
    
          if (transactions) {
              res.json(transactions);
              console.log(transactions)
          } else {
              res.status(404).json({ error: 'User not found' });
          }
      } catch (error) {
          console.error('Error fetching user history', error);
          res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    app.get('/blog/:bid', async (req, res) => {
      const id = req.params.bid;
      console.log(id); // Check the value of id

      try {
        const blog = await blogCollection.findOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : id });

        if (!blog) {
          return res.status(404).json({ error: 'Blog not found' });
        }

        console.log(blog);
        res.json(blog);
      } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.get('/package/:pid', async (req, res) => {
      const id = req.params.pid;
      console.log(id); // Check the value of id

      try {
        const package = await packageCollection.findOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : id });

        if (!package) {
          return res.status(404).json({ error: 'package not found' });
        }

        console.log(package);
        res.json(package);
      } catch (error) {
        console.error('Error fetching package:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.post('/users', async (req, res) => {
      const user = req.body;
      console.log(user)
      const result = await userCollection.insertOne(user)
      res.send(result);
    });
    app.get('/users/:email',async (req,res)=>{
      try {
        const userEmail= req.params.email;
        
        const query = {email: userEmail};
        const user = await userCollection.findOne(query);
        if (user){
          res.json({role:user.role});

        }
        else{
          res.status(404).json({error:'User not found'})
        }
     
      }
      catch(error){
        console.error('Error fetching user role',error)
        res.status(500).json({error:'Internal server error'})
      }
  })
  app.get('/users',async(req,res)=>{
    const query={}
    const users=await userCollection.find(query).toArray();
    console.log(users)
    res.send(users)
  })
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      console.log(review)
      const result= await reviewCollection.insertOne(review)
      res.send(result);

      // try {
      //   const newReview = new Review({ rating, reviewMessage });
       
      //   res.json({ success: true });
      // } catch (error) {
      //   console.error(error);
      //   res.status(500).json({ message: 'Error submitting review' });
      // }
    });
    app.post('/search', async (req, res) => {
      console.log('Received search request:', req.body);
    
      const { from, to, date } = req.body;
      console.log('Received data:', from, to, date);
    
      try {
        const searchResults = await destinationCollection.find({ from, to, date }).toArray();
        console.log('Search Results:', searchResults);
        res.json(searchResults);
      } catch (error) {
        console.error('Error searching in MongoDB:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    app.post('/blog', async (req, res) => {
      const { title, description, date, img, email } = req.body;
      // Here, you can process the received data, save it to a database, or perform any other necessary actions.
      // For this example, we'll just log the received data.
      console.log({ title, description, date, img, email });
      const post = { title, description, date, img, email }; // Create an object to insert
      const result = await blogCollection.insertOne(post);
      console.log(result)
      res.json(result);
    });
    app.patch('/users/:id', async (req, res) => {
      const userId = req.params.id;

      try {
        const result = await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { role: 'admin' } }
        );

        if (result.modifiedCount === 1) {
          res.json({ message: 'User role updated to admin successfully' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
    


  }
  finally {

  }
}
run().catch(console.log)

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}
app.post('/jwt', (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5h' })
  res.send({ token })
})
app.post('/create-payment-intent', verifyJWT, async (req, res) => {
  const { totalPrice, name, id } = req.body;
  const amount = totalPrice * 100;
  console.log(totalPrice, name)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  })
  res.send({
    clientSecret: paymentIntent.client_secret
  })
})

app.get('/', async (req, res) => {
  res.send('travelbug server is urnnund')
})
app.get('')
app.listen(port, () => {
  console.log(`travelbug is running on ${port}`)
})