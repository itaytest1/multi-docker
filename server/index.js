const keys = require('./keys');

//Express app setup

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
//cors enable us to talk between domains
app.use(cors());
app.use(bodyParser.json());

//Postgres set up
const { Pool } = require ('pg');
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on('error', ()=>console.log('Lost postgres connection'));

    //Values = table name, number is the column name
pgClient.query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch(err=>console.log(err));

// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: ()=>1000
});

const redisPublisher =redisClient.duplicate();

// Express route handlers
app.get('/', (req,res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values', (err,values) => {
        res.send(values);
    });
});

//this will be sent from the UI to store all the data and put the data in redis so the worker will start doing its job
app.post('/values', async (req, res) => {
    const index = req.body.index;
    
    if (parseInt(index) > 40){
        return res.status(422).send('Index is too high');
    }
    redisClient.hset('values',index, 'Nothing yet...');
    redisPublisher.publish('insert',index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);
    
    res.send({working: true});
});

app.listen(5000, err => {
    console.log('Listening');
});