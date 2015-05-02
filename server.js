var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var flash    = require('connect-flash');
var bcrypt   = require('bcrypt-nodejs');
var cookieParser = require('cookie-parser')

app.use(cookieParser());
app.set('trust proxy', 1);
app.use(session({secret: 'ssshhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs'); // set up ejs for templating
app.use(flash());

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var format = require('util').format;

var collmember = null;
var url = "mongodb://localhost:27017/authen";

MongoClient.connect(url, function(err, db) {
  if(err) throw err;

    console.log("We are connected");
    collmember = db.collection('members');
	app.listen(8080);
	console.log('%s listening at localhost:8080');
});

app.get('/',function(req,res){
	if(req.session.idUser != undefined || req.cookies.idUser != undefined){
		var id_store = null ;
		if (req.session.idUser != undefined){
			id_store = req.session.idUser;
		}else{
			id_store = req.cookies.idUser;
		}
		var find ={
			_id :new ObjectID(id_store)
		};
		collmember.findOne(find,function(err,result){
			if(err)
				throw err;
			res.render('index.ejs',{
				user : result
			});
		});
	}
	else{
		res.render('index.ejs',{
			user : 0
		});
	}
	
});

app.get('/getmember',checkLogin,function(req, res){
 	collmember.find().toArray(function(err, items) {
		res.send(items);
  	});
});

app.get('/deleteAll',function(req,res){
 	collmember.remove(function(err,result){

 	});	
});

app.get('/login',function(req,res){
	res.render('login.ejs', { message: req.flash('Login') });
});

app.post('/login',function(req,res){

	var find = {
		username : req.body.username
	};	

	collmember.findOne(find, function(err, result) {
	 	if(err)
	 	{
	 		res.render('login.ejs', { message: 'No user found' });
	 	}
	 	else if(!result)
	 	{
	 		res.render('login.ejs', { message: 'No user found' });
	 	}
	 	else if(result != null && bcrypt.compareSync(req.body.password,result.password)) 
	 	{
	 		console.log(bcrypt.compareSync(req.body.password,result.password));
	 		res.cookie('idUser',result._id,{maxAge: 900000});
	 		req.session.idUser = result._id;
	 		res.redirect('/');
	 	}
	 	else
	 	{
	 		res.render('login.ejs', { message: 'ID PASSWORD Missing' });
	 	}
	});	
});

app.get('/logout',function(req,res){
	req.session.destroy();
	res.clearCookie('idUser');
	res.redirect('/')
});

app.get('/signup',function(req,res){
	res.render('signup.ejs', { message: req.flash('') });
});

app.post('/signup',function(req,res){

	var member = {

		username : req.body.username,
		password : bcrypt.hashSync(req.body.password)
		
	};
	console.log(member);
	collmember.findOne({username : req.body.username}, function(err, result) {
	 	if(err)
	 	{
	 		res.render('signup.ejs', { message: req.flash('ID PASSWORD Missing') });
	 	}
	 	else if(result !== null)
	 	{
	 		res.render('signup.ejs', { message: 'ID PASSWORD Have already' });
	 	}
	 	else if(result == null) 
	 	{
		 collmember.insert(member,function(err,result){
		 	if (err) throw err;
			res.redirect('/')
		 });	
	 	}
	});	

});

function checkLogin(req, res, next) {
    if (req.session.idUser != null)
        return next();
    res.send('กรุณา Login');
}

function userLogin(req,done){

	collmember.findOne({_id : req.session.idUser},function(err,result){
		if(err)
			throw err;
		return done;(null,result);
	});

}
