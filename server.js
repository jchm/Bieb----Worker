var http    = require('http');
var fs      = require('fs');
var YQL     = require("yql");
var cronJob = require('cron').CronJob;
var port    = process.env.PORT || 5000;

http.createServer(function (req, res) {

  fs.readFile('message.json', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    
    res.writeHead( 200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'} );
    res.write( data );
    res.end();
  });
  
}).listen(port);

function init() {
  new YQL.exec('select span.content,p from html where url="http://studyspot.uu.nl/main/index/City_Centre/Library_City_Centre" and xpath=\'//div[@class="ui-li-count"]\'', function(response) {
    var free  = 0;
    var total = 0;
    var results = response.query.results.div;
      
    for (var i = 0; i < results.length; i++) {
      free  += parseInt(results[i].span.replace('PCs: ', ''));
      total += parseInt(results[i].p.replace('/ ', ''));
    }
      
    var percentage = calcPercentage(free, total)
    
    makeCache( buildJson(percentage) );
  });
}

function calcPercentage(free, total) {
  return Math.round((free / total) * 100);
}

function makeCache(percentage) {
  fs.writeFile('message.json', JSON.stringify(percentage, null, '\t'), function (err) {
    if (err) throw err;
  });
}

function answer(percentage) {
  if (percentage > 75) {
    return 'Nee';
  }
  
  if (percentage > 50) {
    return 'Prima te doen';
  }
  
  if (percentage > 25) {
    return 'Het is te doen';
  }

  return 'Ja';
}

function buildJson(percentage) {
  return output = {
    'build':  Date(),
    'percentage': percentage,
    'content': answer(percentage)
  };
}

new cronJob('00 */5 * * * *', function(){
    //run every 5 minutes
    init();
    console.log('Cron ran at: ' + Date());
}, null, true, "Europe/Amsterdam");