var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');
var multer = require('multer');

const { ConvertGLBtoGltf, ConvertGltfToGLB, ConvertToGLB} = require('gltf-import-export');
const GltfFile = './uploads/5988710431914478867.gltf';
let gltf;
let gltfRobo;
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

app.post('/vrm/', upload.single('uploadedfile'), (req, res) => {
  let returnGltf, glbFileName = '';
  
  // for white human
  returnGltf = JSON.parse(gltf);
  const hex2rgb = ( hex = "" ) => {
    if ( hex.slice(0, 1) == "#" ) hex = hex.slice(1) ;
    if ( hex.length == 3 ) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3) ;
  
    return [ hex.slice( 0, 2 ), hex.slice( 2, 4 ), hex.slice( 4, 6 ) ].map(( str ) => {
      return parseInt( str, 16 ) / 255;
    } ) ;
  }
  console.log(hex2rgb(req.body.color));
  returnGltf.extensions.VRM.materialProperties[1].vectorProperties._Color = [...hex2rgb(req.body.color), 1];
  returnGltf.extensions.VRM.materialProperties[1].vectorProperties._ShadeColor = [...hex2rgb(req.body.color), 1];
  console.log(returnGltf.materials[1].pbrMetallicRoughness.baseColorFactor);
  glbFileName = GltfFile;
  
  returnGltf.extensions.VRM.meta.author = req.body.username;
  returnGltf.extensions.VRM.meta.contactInformation = "@" + req.body.username;
  returnGltf.extensions.VRM.meta.title = "icon_avatar_" + req.body.username;
  
  const outputGlb = './vrm/' + req.body.username + '.vrm';
  ConvertToGLB(returnGltf, glbFileName, outputGlb);
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
