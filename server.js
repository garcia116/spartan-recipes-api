const express = require('express')
var bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')
const knex = require('knex')
const pg = require('pg');
const register = require('./controllers/register');
const signin = require('./controllers/signin');

const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  }
});


const app = express()


const database = {
	users: [
		{
			id: '123',
			firstname: 'John',
			lastname: 'Bob',
			email: 'john@gmail.com',
			password: 'cookies',
			joined: new Date()
		},
		{
			id: '124',
			name: 'Sally',
			email: 'sally@gmail.com',
			password: 'bananas',
			joined: new Date()
		}
	],

	inventory: [
		{
			id: '2',
			inventory_name: 'apple',
			quantity: '3',
		}
	],
	
}

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res)=> {
	res.send('it is working');
})

app.post('/signin', (req, res) => { signin.handleSignin(req, res, db, bcrypt)})

app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt) })

app.get('/api/inventory', (req , res) => {

	db.select('*').from('inventory')
	.then(inventory => {
		if(inventory.length){
			res.json(inventory)
		} else {
			res.status(400).json('not found')
		}
	})
	.catch(err => res.status(400).json('error getting inventory'))
})

app.post('/api/newInventory', (req, res) => {
	const { inventory_name, quantity} = req.body;

	if(!inventory_name || !quantity){
		return res.status(400).json('incorrect form submission');
	}

	db('inventory').insert({inventory_name, quantity})
		.returning('*')
		.then(item => {
			res.json(item)
		})
	.catch(err => res.status(400).json('unable to register'))
});

app.delete('/api/delete', (req, res) => {
	const {id} = req.body;
	db('inventory').where({id}).del()
	.then(() => {
		res.json({delete: 'true'})
	})
	.catch(err => res.status(400).json({dbError: 'db error'}))
})

app.put('/api/put', (req, res) => {
	const {id, inventory_name, quantity} = req.body;
	db('inventory').where({id}).update({inventory_name, quantity})
		.returning('*')
		.then(item => {
			res.json(item)
		})
		.catch(err => res.status(400).json({dbError: 'db error'}))
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select('*').from('users').where({id})
	.then(user => {
		if(user.length){
		res.json(user[0])
	} else {
		res.status(400).json('not found')
		}
	})
	.catch(err => res.status(400).json('error getting user'))
})



app.listen(process.env.PORT || 3000, ()=> {
	console.log('app is running on port ${process.env.PORT} || 3000');
})