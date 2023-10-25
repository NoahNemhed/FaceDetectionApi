const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors')

const db = knex({
    client: 'pg',
    connection: {
      connectionString: "postgres://root:GPtUO4bWCx5K0aQHNTba8cUptZrT0Nfe@dpg-ckscnbfd47qs73co3ofg-a.oregon-postgres.render.com/facedetection_bxd9",
      ssl: {
        rejectUnauthorized: false,
      },
    },
  });
  
  // Check if the database is connected
  db.raw('SELECT 1')
    .then(() => {
      console.log('Database connection established.');
    })
    .catch(error => {
      console.error('Database connection error:', error);
    });



const app = express();
app.use(bodyParser.json())
app.use(cors())


app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

app.post("/signin", (req,res) => {
    db.select('email', 'hash').from("login")
    .where('email', '=', req.body.email)
    .then(data => {
       const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
       if(isValid){
        db.select('*')
        .from('users')
        .where('email', '=', req.body.email)
        .then(user => {
            res.json(user[0])
        })
        .catch(err => {
            res.status(400).json("Error logging in")
        })    
       }
       else{
        res.status(400).json("Wrong credentials")
       }
       
       
    })
    .catch(err => {
        res.status(400).json("Wrong credentials")
    })

    
})

app.post("/register", (req,res) => {
    const {email,password,name} = req.body
    const hash = bcrypt.hashSync(password)
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
              return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0].email,
                    name: name,
                    joined: new Date()
                }).then(user => {
                    res.json(user[0])
                })
                .catch(err => {
                    res.status(400).json("Unable to register2")
                })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json("Unable to register")) 
})

app.get("/profile/:id", (req,res) => {
    const {id} = req.params;
    let found = false;
    return db.select('*').from("users").where('id', id)
    .then(user => {
        if(user.length){
            res.status(200).json(user[0])
        }else{
            res.status(400).json("User not found")
        }
        
    })
    .catch(err => {
        res.status(400).json("User not found")
    })

})

app.put("/image", (req, res) => {
    const { id } = req.body;
    return db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(data => {
        if(data.length){
            res.json(data[0].entries)
        }else{
            res.status(400).json("Error") 
        }
        
    })
    .catch(err => res.status(400).json("Error"))

});

app.get('/', (req, res) =>{
    res.send("Success") 

}) 









