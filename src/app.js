//its has 2 task to create a server instance and config the server ,
// means which type of api and middleware we want to use in our server and 
// then export the app to use it in other file like index.js where we will start the server by listening on a port
//server start yaha nhi hota-> vo server.js file ma hota hai

const express = require('express');
const app = express();
module.exports = app; 



