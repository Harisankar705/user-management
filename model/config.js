const db=require('./db')
const mongoose=require('mongoose')
//creating a schema
const userschema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true

    }
})

//collection part
const User=new mongoose.model("logins",userschema)
module.exports=User




