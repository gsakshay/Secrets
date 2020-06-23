require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10; 

const app = express();
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/user", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email:String, 
  password:String
});


const User = mongoose.model("User", userSchema);
  
app.get("/",(req,res)=>res.render("home"));

app.get("/register",(req,res)=>res.render("register"));

app.post("/register",(req,res)=>{
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      const user = new User({
        email: req.body.username,
        password: hash
      });
      user.save((err) => {
        if (err) {
          res.send("Sorry couldn't register");
        } else {
          res.render("secrets");
        }
      });
    });
    
})

app.get("/login", (req, res) => res.render("login"));

app.post("/login",(req,res)=>{
    User.findOne({email:req.body.username},
        (err,user)=>{
            if(err){
                res.send("Not able to process the request. Please try after some time");
            }else{
                if(user){
                      bcrypt
                        .compare(req.body.password, user.password)
                        .then(function (result) {
                          if(result === true){
                              res.render("secrets")
                          }else{
                              res.send("Email and password are not matching, please try with valid credentials ")
                            }
                        });
                }else{
                    res.send("Email and password are not matching, please try with valid credentials ")
                }
            }
        })
})

app.listen(3000, () => console.log("Running in port 3000!! Happy coding"));