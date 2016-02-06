/**
 * Module dependencies.
 */

var express = require('express'),
routes = require('./routes'),
user = require('./routes/user'),
http = require('http'),
fs = require('fs'),
exec = require('child_process').exec,
path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'upload')));
app.use(express.bodyParser({
  keepExtensions: true,
  uploadDir: '/upload'
}));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function ConvCMYK(filename, callback) {
  console.log('Start');
  var conv = exec('convert ./upload/' + filename + ' -profile ./iccs/JapanColor2001Coated.icc -profile ./iccs/ColorMatchRGB.icc ./upload/' + filename,
  function(error, stdout, stderr) {
    console.log('conv');
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('OK');
    callback('OK');
  });
}

function ColorSpace(filename, callback) {
  console.log('Start Identfity');
  var ident = exec('identify -format %[colorspace] ./upload/' + filename,
  function(error, stdout, stderr) {
    console.log('ident');
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    console.log('ident OK');
    callback(stdout);
  });
}

app.get('/', routes.index);
app.post('/upload',
function(req, res) {
  // 获得文件的临时路径
  var date = new Date();
  var tmp_path = req.files.imgs.path;
  console.log(tmp_path);
  // 指定文件上传后的目录 - 示例为"pdf"目录。
  var target_path = './upload/' + req.files.imgs.name;
  console.log(target_path);
  // 移动文件
  fs.rename(tmp_path, target_path,
  function(err) {
    if (err) throw err;
    // 删除临时文件夹文件,
    fs.unlink(tmp_path,
    function() {
      if (err) throw err;
      //跳转到转换文件
      ColorSpace(req.files.imgs.name,
      function(data) {
        if (data.replace('\n', '') == 'CMYK') {
          var s1 = new Date();
          ConvCMYK(req.files.imgs.name,
          function call(data) {
            var s2 = new Date();
            console.log(s2 - s1 + "ms");
            res.redirect("/" + req.files.imgs.name);
          });
        } else {
          res.redirect("/" + req.files.imgs.name);
        }
      });
    });
  });
});
http.createServer(app).listen(app.get('port'),
function() {
  console.log('Express server listening on port ' + app.get('port'));
});