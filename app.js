const express = require('express')
const mongoose = require('mongoose')
const app = express()
const port = 3000
const userpath = require('./models/cred')
const usermodel = mongoose.model('user');
const redis = require('redis');
const client = redis.createClient(6360, '127.0.0.1');

let createRedisConnection = async () => {
    await client.connect()
}


let storeValue = async () => {
    await createRedisConnection()
    client.on('connect', function () {
        console.log('Connected!');
    });

    client.on('error', function (e) {
        console.log(e)
        console.log('Connected!');
    });



}

storeValue()

app.use(express.json())
app.use(express.urlencoded())

app.get('/', (req, res) => {
    res.send('Hello World!')
})


//queries
app.post('/user', async (req, res) => {
    console.log(req.body)
    try {
        let data = await usermodel.insert({ ...req.body })
        res.send(data)
    }
    catch (e) {
        res.send(e)
    }
})

async function cacheData(req, res, next) {
    try {
        let users = await client.get(req.body.id);
        console.log(users)
        if (users) {
            results = JSON.parse(users);
            res.send({
                fromCache: true,
                data: results,
            });
        } else {
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(404);
    }
}

async function getUser(req, res, next) {
    console.log('no data')
    try {
        let val = await usermodel.findOne({
            _id: req.body.id
        })
        if (val) {
            await client.set(req.body.id, JSON.stringify(val))
            console.log(val)
            res.send(val)
        }
        else {
            throw 'not found'
        }
    }
    catch (e) {
        console.log(e)
        res.send(e)
    }
}

app.get('/user', cacheData, getUser)

app.put('/user', async (req, res) => {
    console.log(req.body)
    try {
        let val = await usermodel.updateOne({ _id: req.body.id }, req.body)
        res.send(val)
    }
    catch (e) {
        res.send(e)
    }
})


app.delete('/user', async (req, res) => {
    try {
        let val = await usermodel.deleteOne({ _id: req.body.id })
        res.send(val)
    }
    catch (e) {
        res.send(e)
    }
})


let getUsers = async (req, res) => {
    try {
        let val = await usermodel.find()
        await client.set('users', JSON.stringify(val), {
            EX: 15,
            NX: true,
        });
        res.status(400)
        res.send(val)
    }
    catch (e) {
        res.status(200)
        res.send(e)
    }
}

app.get('/users', cacheData, getUsers)


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

mongoose.connect('mongodb://127.0.0.1:27017/mongo', { useNewUrlParser: true });


mongoose.connection.on('error', function (err) {
    console.log('database connection is error')
    console.log(err)
})

mongoose.connection.on('open', function (err) {
    if (err) {
        console.log('database error')
        console.log(err)
    } else {
        console.log('database connection is open success ')
    }
})
