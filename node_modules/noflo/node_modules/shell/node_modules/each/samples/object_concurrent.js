
var each = require('..');

each( {id_1: 1, id_2: 2, id_3: 3} )
.parallel( 2 )
.on('item', function(key, value, next) {
  console.log('key: ', key);
  console.log('value: ', value);
  setTimeout(next, 500);
})
.on('error', function(err, errors){
  console.log(err.message);
  errors.forEach(function(error){
    console.log('  '+error.message);
  });
})
.on('end', function(){
  console.log('Done');
});