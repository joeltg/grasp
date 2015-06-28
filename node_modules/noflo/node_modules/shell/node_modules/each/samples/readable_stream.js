
var fs = require('fs');
var each = require('..');

var eacher = each( {id_1: 1, id_2: 2, id_3: 3} )
.parallel(2)
.on('item', function(key, value, next) {
  setTimeout(function(){
    eacher.emit('data', key + ',' + value + '\n');
    next();
  }, 100);
})
.on('end', function(){
  console.log('Done');
});

eacher.pipe(
  fs.createWriteStream(__dirname + '/out.csv', { flags: 'w' })
);
