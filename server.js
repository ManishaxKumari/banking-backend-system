require("dotenv").config();

const app = require("./src/app");
const connectToDB = require("./src/config/db");

async function startServer() {
    try {
        await connectToDB();

        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server running on port ${process.env.PORT || 3000}`);
        });
    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }
}

startServer();

//primary responsibility of this file is to start the server and connect to the database.
//  It imports the app from app.js file and the connectToDB function from db.js file. 
// Then it calls the connectToDB function to connect to the database and starts the server on port 3000.