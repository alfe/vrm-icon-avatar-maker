var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var multer = require('multer');

const { ConvertGLBtoGltf, ConvertGltfToGLB, ConvertToGLB} = require('gltf-import-export');
const GltfFile = './uploads/icon_avatar.vrm.gltf';
let gltf;
fs.readFile(GltfFile, 'utf8', (err, text) => {
	gltf = text;
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
var storage = multer.diskStorage({
          destination: function (req, file, cb) {
                      cb(null, './uploads')
                    },
          filename: function (req, file, cb) {
                      cb(null, '[' + req.body.username + ']' + file.originalname)
                    }
});
var upload = multer({ storage: storage });

app.post('/', upload.single('uploadedfile'), function (req, res) {
	const returnGltf = JSON.parse(gltf);
	returnGltf.images = [{
		name: "icon",
		uri: './' + '[' + req.body.username + ']' + req.file.originalname,
    }]
    returnGltf.extensions.VRM.meta.author = req.body.username;
    returnGltf.extensions.VRM.meta.contactInformation = "@" + req.body.username;
    returnGltf.extensions.VRM.meta.title = "icon_avatar_" + req.body.username;

	const outputGlb = './vrm/' + req.body.username + '.vrm';
    ConvertToGLB(returnGltf, GltfFile, outputGlb);
    res.redirect(301, '/vrms/' + req.body.username + '.vrm');
});

app.get('/vrms/:file', function(req, res){
    fs.readFile('./vrm/' + req.params.file,
        function(err, data) {
        res.send(data, 200);
    });
});

app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
