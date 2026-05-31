require('dotenv').config(); // load environment variables from .env file and make them available in process.env
const app=require("./src/app"); // import the app from app.js file
const connectToDB=require("./src/config/db"); // import the connectToDB function from db.js file


connectToDB(); // connect to the database

app.listen(3000,()=>{ // use for start the server and listen on port 3000
    console.log("server is running on port 3000"); //return a message in console when server is running
})