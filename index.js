const express = require("express");
const mongoose = require("mongoose");
var bodyParser = require('body-parser')
const ejs = require("ejs");
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
var cors = require('cors');
let axios = require('axios');
let url = require("url");
var request = require('request');
var crypto=require('crypto');
var async=require('async');
const { TwitterApi } = require('twitter-api-v2');
Schema = mongoose.Schema

const { generateAuthUrl, getAccessToken } = require("tw-3-legged");
//const path = require("path");
dotenv.config();

const saltRounds = 10;

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
  next(); 
});

app.set("view engine", "ejs");

const Client_ID = 'Qmk4NUVLbDV5LWtQM2JlcDhFUDY6MTpjaQ';
const Client_Secret = 'nQ3jc0MAVSo6luHyDm1v1PWzLmy7NjTt7hePfdgAFGd6jLnH_w';

const API_Key='6ioRlvj1uZxNwnmrPKnhvBi2Z';
const API_Key_Secret='sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE';


const request_token_url = 'https://api.twitter.com/oauth/request_token';
const access_token_url = 'https://api.twitter.com/oauth/access_token';
const authorize_url = 'https://api.twitter.com/oauth/authorize';
const show_user_url = 'https://api.twitter.com/1.1/users/show.json';


const userSchema = new mongoose.Schema({
  UserName: String,
  TId: String
});

const User = new mongoose.model("User", userSchema);

const replySchema = new mongoose.Schema({

  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  TweetId: {
    type: String,
    required: true,
  },
});

const Reply = new mongoose.model("Reply", replySchema);

const deleteSchema = new mongoose.Schema({

  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  TweetId: {
    type: String,
    required: true,
  },
});

const Delete = new mongoose.model("delete", deleteSchema);

const adminSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
});

const Admin = new mongoose.model("Admin", adminSchema);

const UserNameSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    default: true,
  }
});

const UserName = new mongoose.model("username", UserNameSchema);


app.use(
  express.urlencoded({
    extended: true,
  })
);


const verifyToken = (req, res, next) => {
    
  jwt.verify(req.headers['authorization'], process.env.JWT_SECRET, async (err, decoded) => {
     
      const platform = req.headers['x-Bot007'];

      if (err || !decoded || !decoded.sub) return res.unauthorized(null, req.__('UNAUTHORIZED'));
      
      const user = await User.findOne({
          _id: decoded.sub,
          TId: decoded.TId
      });
      console.log(user,"------------------------------------>>>>>>>>>>>>>>>>>>>>>>>>")
      if (!user) return res.unauthorized(null, req.__('UNAUTHORIZED'));
      

      req._id = user['_id'];
      req.TId =user['TId'];
      req.UserName=decoded.UserName;
      req.oauthToken=decoded.oauthToken;
      req.oauthTokenSecret=decoded.oauthTokenSecret;
      next();
  });
}

app.post("/login", async function (req, res) {
  let  { email,password }=req.body;
  try {

    let admin=await Admin.findOne({email});
    console.log(admin)

    if(admin&&admin.password===password){
      const payload = {
        sub:admin._id,
        email:admin.userId,
        name: admin.name,
        admin:admin
    };
     let AdminJWT = jwt.sign(payload, process.env.JWT_SECRET);
     return res.send({
      success:true,
      AdminJWT: AdminJWT,
      msg: 'Successfully logged in'
     });
     
    }else return res.send({success:false,msg: 'loggin failed'});

  }catch(err){
    console.log(err)
  }
});

app.post("/AddUserName", async function (req, res) {
  let  { username }=req.body;
  try {
    console.log("======",username)
    let _username = await UserName.findOne({username});
    console.log("======",_username);
    if(_username){}else{
      let _username_ = new UserName();
      _username_.username=username;
      await _username_.save();
    }

    let UserNames = await UserName.find();

     return res.send({
      success:true,
      UserNames: UserNames,
      msg: 'UserName added successfully'
     });

  }catch(err){
    console.log(err)
  }
});

app.post("/DeleteUserName", async function (req, res) {
  let  { ID }=req.body;
  try {

    await UserName.findOneAndDelete({_id:ID});
    let UserNames = await UserName.find();

     return res.send({
      success:true,
      UserNames: UserNames,
      msg: 'UserName deleted successfully'
     });

  }catch(err){
    console.log(err)
  }
});

app.get("/UserNames", async function (req, res) {
 // let  { ID }=req.body;
  try {

    let UserNames = await UserName.find();

     return res.send({
      success:true,
      UserNames: UserNames,
      msg: 'UserNames fetched successfully'
     });

  }catch(err){
    console.log(err)
  }
});

app.get("/Test", async function (req, res) {
  // let  { ID }=req.body;
   try {
 
     await UserName.deleteMany();
 
      return res.send({
       success:true,
      // admin
      });
 
   }catch(err){
     console.log(err)
   }
});





app.get("/",verifyToken, async function (req, res) {
  let  { Tuser }=req.query;
  try {

    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });

   
    let userName_=await UserName.find();
    let USERNAME=[];
    if(userName_.length > 0){
      userName_.map(x=>{
        let U=(x.username).replace('t.me/','')
        USERNAME.push(U)
      });
    }else{
      USERNAME.push('elonmusk')
    }
    
    let arr=[];
    let reply = await Reply.find({userId:req._id});
    let ARR=[];
    if(reply.length>0){
      reply.map(x=>{
        ARR.push(x.TweetId);
      })
    }
   let DEL=[];
    let delet = await Delete.find({userId:req._id});
    console.log("PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",delet)
    if(delet.length>0){
      delet.map(x=>{
        DEL.push(x.TweetId);
      })
    }
    const jack = await userClient.v2.usersByUsernames(USERNAME);
   console.log("HHHHHHHHHHHHHHHHHHHHHH",DEL)
    async.mapSeries(jack.data,async r=>{
      const tweetsOfJack = await userClient.v2.userTimeline(r.id,{ exclude: 'replies' });
     
      for (const fetchedTweet of tweetsOfJack) {
        console.log(ARR.includes(fetchedTweet.id),DEL.includes(fetchedTweet.id))
       if(!ARR.includes(fetchedTweet.id)&&!DEL.includes(fetchedTweet.id)) arr.push(fetchedTweet.id);
      }
      console.log(arr)
    }, async function(){
      const tweets = await userClient.v1.tweets(arr);
      //console.log(tweets)
      return res.send({tweets});
    });

  }catch(err){
    console.log(err)
  }
});

app.get("/goto/:Tuser", async function (req, res) {
  try {
    let Tuser =req.params.Tuser;
    console.log("Tuser", Tuser)
    res.redirect(url.format({
      pathname:"https://bot007.netlify.app/",
      query: {
        Tuser:Tuser
       }
    }));

  } catch (err) {
    console.log(err)
  }
});

app.get("/start", async function (req, res) {
  try {
    const callbackUrl = 'https://bot007007.herokuapp.com/callback'
    const authUrl = await generateAuthUrl(API_Key, API_Key_Secret, callbackUrl);
    //console.log("-----------------------------------lllllllllllllllllllllllll", authUrl)
    return res.send({ authUrl });
    //res.render("start",{authUrl});

  } catch (err) {
    console.log("err", err)
  }
});

app.get("/callback",async function (req, res) {
  try{
    console.log("======================================================")
    const { oauth_token, oauth_verifier}=req.query;
    const TOKEN = await getAccessToken(oauth_token, oauth_verifier);
    let JWT='';
 
    await User.findOneAndDelete({userId:TOKEN.userId});
    let user=await User.findOne({userId:TOKEN.userId});
    if(user){
      console.log("TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT")
    }else{
      let _user=new User();
      _user.TId=TOKEN.userId;
      _user.UserName=TOKEN.screenName;
      let USER=await _user.save();

      if(TOKEN){
        const payload = {
          sub:USER._id,
          TId:TOKEN.userId,
          screenName: TOKEN.screenName,
          oauthToken: TOKEN.oauthToken,
          oauthTokenSecret:TOKEN.oauthTokenSecret
      };
        JWT = jwt.sign(payload, process.env.JWT_SECRET);

        console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",JWT);
       
        res.redirect(url.format({
          pathname: `https://bot007.netlify.app/`,
          query: {
            token: JWT,
            Tuser: ""
          }
        }));
      }
    }
    

  }catch(err){
    console.log("err",err);
  }
});

app.get("/like",verifyToken,async function (req, res) {
  try{

    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });


    const meUser = await userClient.v2.me();
    const ID=req.query.ID;
    let response=await userClient.v2.like(meUser.data.id, ID);
    return res.send({response})
  }catch(err){
    console.log("err",err);
  }

 
});

app.get("/dislike",verifyToken,async function (req, res) {
  try{

    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });

    const meUser = await userClient.v2.me();
    const ID=req.query.ID;
    let response=await userClient.v2.unlike(meUser.data.id, ID);
    return res.send({response})
  }catch(err){
    console.log("err",err);
  }

 
});

app.get("/reply",verifyToken,async function (req, res) {
  try{

    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });

    const meUser = await userClient.v2.me();
    const {ID,TweetId}=req.query;
    const reply = req.query.reply;
    let response=await userClient.v2.reply(
      reply,
      ID,
    );
    let _reply=new Reply();
    _reply.userId=req._id;
    _reply.TweetId=ID;
    await _reply.save();

    return res.send({response})

  }catch(err){
    console.log("err",err);
  }

 
});

app.get("/retweet",verifyToken,async function (req, res) {
  try{


    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });

    const meUser = await userClient.v2.me();
    const ID=req.query.ID;
    const reply = req.query.reply;
    let userId=meUser.data.id;
    let response=await userClient.v2.retweet(userId, ID);
    return res.send({response})

  }catch(err){
    console.log("err",err);
  }
});

app.get("/unretweet",verifyToken,async function (req, res) {
  try{

    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });



    const meUser = await userClient.v2.me();
    const ID=req.query.ID;
    const reply = req.query.reply;
    let userId=meUser.data.id;
    let response=await userClient.v2.unretweet(userId, ID);
    return res.send({response})

  }catch(err){
    console.log("err",err);
  }
});
app.get("/delete",verifyToken,async function (req, res) {
  try{


    const userClient = new TwitterApi({
      appKey: '6ioRlvj1uZxNwnmrPKnhvBi2Z',
      appSecret: 'sdh0v0qyvqdS38RI0JtfT7D6fUxSJzjVyssm2dfoW7GBA5spxE',
      accessToken: req.oauthToken,
      accessSecret: req.oauthTokenSecret,
    });


    //const meUser = await userClient.v2.me();
    const TweetId=req.query.TweetId;
    
    let DELETE=new Delete();
    DELETE.userId=req._id;
    DELETE.TweetId=TweetId;
    await DELETE.save();


    return res.send({})

  }catch(err){
    console.log("err",err);
  }
});

app.listen((process.env.PORT || 5001), function () {
  console.log("Server has started at port 5001");
});



