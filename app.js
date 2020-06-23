require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
    secret:"supersecrett.",
    resave:false,
    saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/user", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set('useCreateIndex',true);

const userSchema = new mongoose.Schema({
  email:String, 
  password:String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
  
app.get("/",(req,res)=>res.render("home"));

app.get("/register",(req,res)=>res.render("register"));

app.post("/register",(req,res)=>{
    User.register({username:req.body.username, active: false}, req.body.password, (err, user) => {
        if (err) { 
            console.log(err);
            res.redirect('register'); 
        }else{
            passport.authenticate("local")(req, res, () => res.redirect("secrets"))    
        }
    })
})

app.get("/secrets",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.render("login");
    }
})

app.get("/login", (req, res) => res.render("login"));

app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if(err){
            res.redirect("login");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("secrets");
            });
        }
    })  
});

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/")
})

app.listen(3000, () => console.log("Running in port 3000!! Happy coding"));