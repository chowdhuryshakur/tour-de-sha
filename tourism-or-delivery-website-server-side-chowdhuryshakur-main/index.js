const express = require('express')
const { MongoClient } = require('mongodb');
require('dotenv').config()
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
let multer = require('multer');
const uuidv4 = require('uuid/v4')

const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p2ptn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('shakur');
        const offersCollection = database.collection('Offers');
        const bookingsCollection = database.collection('booking');

        //offer APIs
        // GET API
        app.get('/offers', async (req, res) => {
            const cursor = offersCollection.find({});
            const offers = await cursor.toArray();
            res.send(offers);
        });
        // GET 
        app.get('/offers/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const offer = await offersCollection.findOne(query);
            res.json(offer);
        })

        // POST API
        app.post('/offers', async (req, res) => {
            const offer = req.body;
            const result = await offersCollection.insertOne(offer);
            res.json(result)
        });

        // booking APIs
        //post
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.json(result)
        });
        //get
        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { user_mail: email };
            const cursor = await bookingsCollection.find(query);
            const bookings = await cursor.toArray();
            res.json(bookings);
        })
        //get
        app.get('/bookings', async (req, res) => {
            const cursor = await bookingsCollection.find({});
            const bookings = await cursor.toArray();
            res.json(bookings);
        })
        //put
        app.put('/bookings/:id', (req, res) => {
            const id = req.params.id;
            const result = bookingsCollection.findOneAndUpdate(
                { _id: ObjectId(id) },
                {
                    $set: {
                        status: req.body.status
                    }
                },
                {
                    upsert: true
                }
            );
            res.json(result);
        })
        //DELETE
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.deleteOne(query);
            res.json(result);

            //photo upload
            const DIR = './public/';

            const storage = multer.diskStorage({
                destination: (req, file, cb) => {
                    cb(null, DIR);
                },
                filename: (req, file, cb) => {
                    const fileName = file.originalname.toLowerCase().split(' ').join('-');
                    cb(null, uuidv4() + '-' + fileName)
                }
            });

            var upload = multer({
                storage: storage,
                fileFilter: (req, file, cb) => {
                    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
                        cb(null, true);
                    } else {
                        cb(null, false);
                        return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
                    }
                }
            });

            app.post('/offers', upload.single('profileImg'), (req, res, next) => {
                const url = req.protocol + '://' + req.get('host')
                const img = {
                    img: url + '/public/' + req.file.filename
                }
                user.save().then(result => {
                    res.status(201).json({
                        message: "User registered successfully!",
                        userCreated: {
                            _id: result._id,
                            profileImg: result.profileImg
                        }
                    })
                }).catch(err => {
                    console.log(err),
                        res.status(500).json({
                            error: err
                        });
                })
            })
        })

    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})