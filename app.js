require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");


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
  email: String,
  password: String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser( (id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
  
app.get("/",(req,res)=>res.render("home"));

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

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
    User.find({"secret":{$ne:null}},(err,users)=>{
        if(err){
            console.log(err);
        }else{
            res.render("secrets",{userSecrets:users})
        }
    })
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

app.get("/submit",(req,res) => {
    if (req.isAuthenticated()) {
      res.render("submit");
    } else {
      res.render("login");
    }
})

app.post("/submit",(req,res) => {
    if (req.isAuthenticated()) {
       User.findById(req.user.id,(err,user)=>{
           if(err){
               console.log(err);
           }else{
               if(user){ 
                   user.secret = req.body.secret;
                   user.save((err)=>{
                       if(!err){
                           res.redirect("secrets");
                       }
                   })
               }
           }
       })
    } else {
      res.render("login");
    }
})

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/")
})

app.listen(3000, () => console.log("Running in port 3000!! Happy coding"));