process.on('unhandledRejection', console.log);
process.chdir(require('path').join(__dirname, '../'));

var express = require('express');
var app = express();

app.use(express.static('./node_modules/hyperapp/dist'));
app.use(express.static('./frontend'));

app.get('*',(req, res)=>{
  res.sendFile('/frontend/index.html');
});

app.listen(3000, function() {
  console.log('Simple listening on port 3000');
});
