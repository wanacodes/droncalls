const functions = require('firebase-functions');

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const admin = require('firebase-admin');

// Fetch the service account key JSON file contents
const serviceAccount = require('./server/serviceAccountKey.json');

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://notes-10da9.firebaseio.com/'
});

var db = admin.database();
var ref = db.ref('notes');

// Init App
const app = express();

// Log all request
app.use(morgan('combined'))

// Load View Engine
app.set('views', path.join(__dirname, 'views')); //__dirname specify current path
app.set('view engine', 'pug');

// Use current folder for static files
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + "/public", {
    index: false, 
    immutable: true, 
    cacheControl: true,
    maxAge: "30d"
}));

// Body Parser Middleware
//parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({extended: false}));
//parse json
app.use(bodyParser.json());

// Home Route
app.get('/', (req, res) => {
    // res.send('hello world');
    ref.orderByChild('name').once('value')
        .then((snapshot) => {
            
            // Check if the db is empty
            if (!snapshot.exists()) {
                console.log("The db is empty!");
            } else {
                console.log(snapshot.val());
                var key = snapshot.key;
                // console.log(key);
                return snapshot.val();
            }

        })
        .then((key) => {
            console.log(key);
            
            res.render('index', {
                title: 'Notes',
                notes: key
            });
        }), function(error) {
            // Something went wrong
            console.log(error);
        }

    // res.send("ok");
    // 
});

// Open Update
app.get('/article/:name', (req, res) => {
    // console.log("hello" + JSON.stringify(req.params));
    console.log(JSON.stringify(req.params));
    res.render('edit_notes', {
        title: 'Edit Notes',
        notes: req.params
    });
    // res.json(req.params.id)
});

app.post('/articles/update', (req, res) => {
    // console.log("updated");
    console.log(req.body.name_edit);
    console.log(req.body.name_original);
    
    ref.orderByChild('name').equalTo(req.body.name_original).once('value')
    .then((snapshot) => {
        if (!snapshot.exists()){
            res.send(`${req.body.name_original} is not exists! Cannot update`)
        } else {
            ref.once('value').then(function(snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    console.log(key);
                    console.log(childData.name);
                    if (childData.name === req.body.name_original) {
                        console.log('same!');
                        ref.child(key).set({
                            name: req.body.name_edit, //change to the updated value
                        });
                        res.redirect('/')
                    }
                });
            });
        }
        
    }, function(err){
        console.log(err)
    });

});

// Delete Notes
app.delete('/article/:name', (req, res) => {
    // res.send(req.params.name);

    const name = req.params.name;

    // Check the user exist
    // If yes update the new data
    ref.orderByChild('name').equalTo(name).once('value',snapshot => {
        if (!snapshot.exists()) {
            res.send(`${name} is not exists! Cannot delete`);
        } else {

            ref.once('value').then(function(snapshot) {
                // var key = snapshot.key; // null
                snapshot.forEach(function (childSnapshot) {
                    var key = childSnapshot.key;
                    var childData = childSnapshot.val();
                    console.log(key);
                    console.log(childData.name);
                    // console.log(Object.values(childData.Data)[0]);
                    if (childData.name === name) {
                        console.log('same!');
                        let del_ref = db.ref('notes/' + key);
                        del_ref.remove()
                            .then(function() {
                                res.send({ status: 'deleted' });
                            })
                            .catch(function(error) {
                                console.log('Error deleting data:', error);
                                res.send({ status: 'error', error: error });
                            });
                    }
                });
            });
            // 
        }
    }, function (errorObject) {
        console.log('The read failed: ' + errorObject.code);
   });
});

    // res.send('ok')

// Add Route
app.get('/articles/add', (req, res) => {
    res.render('add_notes', {
        title: 'Add Notes'
    })
});

// Insert new data
app.post('/articles/add', (req, res) => {
    // Test API
    //return console.log("submitted!");

    let notes = {};
    // console.log(req.body.name);
    notes.name = req.body.name;

    ref.once('value')
    .then(function() {
        ref.push(notes);
    })
    .then(function(){
        res.redirect('/')
    }), function(err) {
        console.log(err);
    }
});

app.get('/api/getUsers', (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        
        ref.orderByChild('name').once('value', function(snapshot) {
            var data = snapshot.val();
            res.send({'data': data});
            console.log(data);
        }, function (errorObject) {
            console.log('The read failed: ' + errorObject.code);
        });
          
    } else {
        res.send('Cannot send request in body');
    }
});

// Post Request
app.post('/api/postUsers', (req, res) => {

    // Init the value pass to the api
    const name = req.body.name;

    // Check the user exist
    // If yes insert the new data
    ref.orderByChild('name').equalTo(name).once('value',snapshot => {
        if (snapshot.exists()){
            res.send(`${name} is already exists!`)
        } else {
            ref.push({'name': name});
            res.send(`${name} is created successfully`)
        }
    }, function (errorObject) {
         console.log('The read failed: ' + errorObject.code);
    });
});

exports.app = functions.https.onRequest(app);
