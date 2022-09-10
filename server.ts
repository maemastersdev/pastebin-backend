import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// Here, creating route parameters for the paste functionality of the app.

// Route Param to POST a paste 

app.post("/pastes/addAPaste", async (req,res) => {
  try {
    const {pastebody, pastetitle} = req.body;
    if (!pastebody){
    res.send('Please add a paste')
    }
    else {
      const newPaste = await client.query('INSERT INTO pastes (pastebody, title) VALUES ($1, $2) RETURNING *', [pastebody, pastetitle])
      res.json(newPaste.rows);
    }
  } catch(err) {
    res.status(500).send("There has been an error, see console for details.");
    console.error(err);
  }
})

// Route Param to get all pastes
app.get("/pastes", async (req, res) => {
  try {
    const allPastes = await client.query('SELECT * FROM pastes ORDER BY DATE DESC')
    res.json(allPastes.rows);
  } catch(err) {
    res.status(500).send("There has been an error, see console for details.");
    console.error(err);
  }
});

// Route Param to get a specific paste
// Here pasteid is currently a string (hopefully that is fine?)
app.get("/pastes/:pasteid", async (req, res) => {
  try {
    const pasteid = req.params.pasteid;
    const specificPaste = await client.query('SELECT * FROM pastes WHERE pasteid=$1',[pasteid]);
    res.json(specificPaste.rows);
  } catch(err) {
    res.status(500).send("There has been an error, see console for details.");
    console.error(err);
  }
});


// Route Param to delete a specific paste
// Here pasteid is currently a string (hopefully that is fine?)
app.delete("/pastes/:pasteid", async (req, res)=>{
  try{
    const pasteid  = req.params.pasteid;
    const deletePost= await client.query('DELETE FROM paste_entries WHERE pasteid=$1',[pasteid])
    res.send(`post with id: ${pasteid} has been deleted`)
  }
  catch(err){
    res.status(500).send("There has been an error, see console for details.");
    console.error(err);
  }
})

// Route Param to delete all pastes
// To add later - perhaps a danger zone feature.

// Creating route parameters for the comments functionality of the app.


//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
