const mongoose=require('mongoose');

function connectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("server connected to database");
    })
    .catch((err)=>{
        console.error("Error connecting to database:", err);
        process.exit(1); // Exit the process with an error code
    });
}

module.exports = connectToDB