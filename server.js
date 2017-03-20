var ejs = require('ejs');
var express = require('express');
var request = require('request');
var cron = require('cron');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

//getting key from config.js
var config = require('./config');
var key = config.key;

var ver;
var id;
var name;
var level;
var simg;
var fimg;
var srank;
var frank;
var slp;
var flp;
var swins;
var sloss;
var bg;
var floss;
var fwins;
var champDataId;

function getVer() {
  request({
    url: "https://global.api.pvp.net/api/lol/static-data/euw/v1.2/versions?api_key=" + key,
    json: true
  }, function(error, respone, json) {
    ver = json[0];
    console.log("Version: " + ver);
  });
  request({
    url: "https://global.api.pvp.net/api/lol/static-data/EUW/v1.2/champion?dataById=true&api_key=" + key,
    json: true
  }, function(error, response, json) {
    champDataId = json.data;
  });
}


var imagesArr = "";

function getImages() {
  imagesArr = "";
  request({
    url: "https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=image&api_key=" + key,
    json: true
  }, function(error, response, cjson) {
    request({
      url: "https://euw.api.pvp.net/api/lol/euw/v1.2/champion?freeToPlay=true&api_key=" + key,
      json: true
    }, function(error, respone, fjson) {
      if(!error & respone.statusCode == 200)
      {
      var idArr = [];
      var nameArr = [];
      for (var i = 0; i < fjson.champions.length; i++) {
        idArr.push(fjson.champions[i].id);

        for (var prop in cjson.data) {
          if (fjson.champions[i].id == cjson.data[prop].id) {
            nameArr.push(cjson.data[prop].image.full);
          }
        }
      }
      for (var i = 0; i < nameArr.length; i++) {
        if (nameArr[i] == 'FiddleSticks.png') {
          nameArr[i] = 'Fiddlesticks.png';
        }
        var img = "<img src='Resource/img/champion/" + nameArr[i] + "' alt='" + nameArr[i] + "'>";
        imagesArr += img;
      }
    }
    else {
      console.log(respone.statusCode + error);
    }
    });
  });
}

getVer();
getImages();

var cronJob = cron.job('0 */30 * * * *', function() {
  getVer();
  getImages();
  console.log('cronjob complete ');
});
cronJob.start();

app.get('/', function(req, res) {
  request({
    url: "https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=skins&api_key=" + key,
    json: true
  }, function(error, response, json) {
    var result;
    var count = 0;
    //Object.keys(json.data).length = how many champs
    var max = Math.floor(Object.keys(json.data).length); //max number of champs
    var randNum = Math.floor(Math.random() * max); //random champ number
    var count = 0;
    for (var prop in json.data) {
      if (randNum == count) {
        var maxS = Math.floor(json.data[prop].skins.length) - 1; //max number of skins
        var randNumS = Math.floor(Math.random() * maxS); //random skin number
        break;
      }
      count++;
    }
    bg = "Resource/splash/" + prop + "_" + randNumS + ".jpg";
    res.render('index', {
      bg: bg,
      imagesArr: imagesArr
    });
  });
})

app.get('/summoner', function(req, res) {
  var reg = req.query.reg;
  var summ = req.query.summ;
  var summC = summ.replace(/\s+/g, '');
  var summC = summC.toLowerCase();
  request({
    url: "https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=skins&api_key=" + key,
    json: true
  }, function(error, response, json) {
    var result;
    var count = 0;
    //Object.keys(json.data).length = how many champs
    var max = Math.floor(Object.keys(json.data).length); //max number of champs
    var randNum = Math.floor(Math.random() * max); //random champ number
    var count = 0;
    for (var prop in json.data) {
      if (randNum == count) {
        var maxS = Math.floor(json.data[prop].skins.length) - 1; //max number of skins
        var randNumS = Math.floor(Math.random() * maxS); //random skin number
        break;
      }
      count++;
    }

    var bg = "Resource/splash/" + prop + "_" + randNumS + ".jpg";
    var url = "https://" + reg + ".api.pvp.net/api/lol/" + reg + "/v1.4/summoner/by-name/" + summ + "?api_key=" + key;
    console.log(summ + " is requesting summ information on " + reg);
    request({
      url: url,
      json: true
    }, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        id = body[summC].id;
        profId = body[summC].profileIconId;
        name = body[summC].name;
        level = body[summC].summonerLevel;

        request({
          url: "https://euw.api.pvp.net/api/lol/euw/v1.3/game/by-summoner/" + id + "/recent?api_key=" + key,
          json: true
        }, function(error, response, body) {

          var timeArr = [];
          var dateArr = [];
          var summs = [];
          var games = "";
          for (var game = 0; game < 10; game++) {
            for (var i = 0; i < body.games.length; i++) {
              minutes = Math.floor(body.games[i].stats.timePlayed / 60);
              seconds = body.games[i].stats.timePlayed - minutes * 60;
              time = (seconds < 10) ? minutes + ":0" + seconds : minutes + ":" + seconds;
              timeArr.push(time);
              date = new Date(body.games[i].createDate);
              date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
              dateArr.push(date);
            }
            var itemArr = "";
            for (var j = 0; j <= 5; j++) {
              if (body.games[game].stats.hasOwnProperty(['item' + j])) {
                itemArr += "<img src='Resource/img/item/" + body.games[game].stats['item' + j] + ".png' alt='item' id='item'>";
              } else {
                itemArr += "<img src='Resource/img/item/1000.png' alt='item' id='item'>";
              }
            }
            if (body.games[game].stats.hasOwnProperty(['item6'])) {
              itemArr += "<img src='Resource/img/item/" + body.games[game].stats['item6'] + ".png' alt='ward' id='item'>";
            }

            var stats = "";
            stats += (body.games[game].stats.hasOwnProperty('championsKilled') ? body.games[game].stats.championsKilled + '/' : 0 + '/') + (body.games[game].stats.hasOwnProperty('numDeaths') ? body.games[game].stats.numDeaths + '/' : 0 + '/') + (body.games[game].stats.hasOwnProperty('assists') ? body.games[game].stats.assists + '/' : 0 + '/');
            stats += ' ' + ((body.games[game].stats.hasOwnProperty('minionsKilled') ? body.games[game].stats.minionsKilled : 0) + (body.games[game].stats.hasOwnProperty('neutralMinionsKilledEnemyJungle') ? body.games[game].stats.neutralMinionsKilledEnemyJungle : 0) + (body.games[game].stats.hasOwnProperty('neutralMinionsKilledYourJungle') ? body.games[game].stats.neutralMinionsKilledYourJungle : 0)) + ' ';
            stats += body.games[game].stats.goldEarned;

            var summsTemp = "";
            for (var spell = 1; spell <= 2; spell++) {
              summsTemp += "<img src='Resource/img/spell/" + body.games[game]['spell' + spell] + ".png' alt='spell' id='spell'>";
            }
            summs.push(summsTemp);

            //ugly display thing best way I can do it noob
            if (body.games[game].stats.win === true) {
              games += `<div id="won">
                <div>
                  <img src="Resource/img/champion/` + champDataId[body.games[game].championId].key + `.png" alt="champPic" id="champ">
                </div>
                <div id="info">
                  <h3 id="win">Won</h3>
                  <h4> Ranked Solo/Queue</h4>
                  <div>` +
                summs[game] +
                `
                  </div>
                </div>
                <div id=itemstat>
                  <div id="items">
                    <div>
                      ` +
                itemArr +
                `
                    </div>
                  </div>
                  <div id="stats">
                    <p id="stattext">` + stats + `<img src="Resource/img/coins.png" alt="coins" style="max-width: 25px"></p>
                  </div>
                </div>
                <div id="time">
                  <h3> ` + timeArr[game] + `</h3>
                  <h3> ` + dateArr[game] + ` </h3>
                </div>
              </div>`
            } else if (body.games[game].stats.win === false) {
              games += `<div id="lost">
                <div>
                  <img src="Resource/img/champion/` + champDataId[body.games[game].championId].key + `.png" alt="champPic" id="champ">
                </div>
                <div id="info">
                  <h3 id="lose">Defeat</h3>
                  <h4> Ranked Solo/Queue</h4>
                  <div>` +
                summs[game] +
                `
                  </div>
                </div>
                <div id=itemstat>
                  <div id="items">
                    <div>
                      ` +
                itemArr +
                `
                    </div>
                  </div>
                  <div id="stats">
                  <p id="stattext">` + stats + `<img src="Resource/img/coins.png" alt="coins" style="max-width: 25px"></p>
                  </div>
                </div>
                <div id="time">
                  <h3> ` + timeArr[game] + `</h3>
                  <h3> ` + dateArr[game] + ` </h3>
                </div>
              </div>`
            }
          }

          var url2 = "https://" + reg + ".api.pvp.net/api/lol/" + reg + "/v2.5/league/by-summoner/" + id + "/?api_key=" + key;
          request({
            url: url2,
            json: true
          }, function(error, response, body) {
            if (!error && response.statusCode === 200) {
              if (body[id][0] !== undefined) {
                for (var i = 0; i < body[id][0].entries.length; i++) {
                  if (body[id][0].entries[i].playerOrTeamId == id) {
                    break;
                  }
                }
              }
              if (body[id][1] !== undefined) {
                for (var x = 0; x < body[id][1].entries.length; x++) {
                  if (body[id][1].entries[x].playerOrTeamId == id) {
                    break;
                  }
                }
              }

              if (body[id][0] !== undefined) {
                swins = body[id][0].entries[i].wins;
                sloss = body[id][0].entries[i].losses;
                if (body[id][0].tier == 'CHALLENGER') {
                  simg = "Resource/tier-icons/base_icons/challenger.png";
                  srank = body[id][0].tier;
                  slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                } else if (body[id][0].tier == 'MASTER') {
                  simg = "Resource/tier-icons/base_icons/master.png";
                  srank = body[id][0].tier;
                  slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                } else if (body[id][0].tier == 'DIAMOND') {
                  if (body[id][0].entries[i].division == 'V') {
                    simg = "Resource/tier-icons/tier_icons/diamond_v.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'IV') {
                    simg = "Resource/tier-icons/tier_icons/diamond_iv.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'III') {
                    simg = "Resource/tier-icons/tier_icons/diamond_iii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'II') {
                    simg = "Resource/tier-icons/tier_icons/diamond_ii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'I') {
                    simg = "Resource/tier-icons/tier_icons/diamond_i.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  }
                } else if (body[id][0].tier == 'PLATINUM') {
                  if (body[id][0].entries[i].division == 'V') {
                    simg = "Resource/tier-icons/tier_icons/platinum_v.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'IV') {
                    simg = "Resource/tier-icons/tier_icons/platinum_iv.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'III') {
                    simg = "Resource/tier-icons/tier_icons/platinum_iii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'II') {
                    simg = "Resource/tier-icons/tier_icons/platinum_ii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'I') {
                    simg = "Resource/tier-icons/tier_icons/platinum_i.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  }
                } else if (body[id][0].tier == 'GOLD') {
                  if (body[id][0].entries[i].division == 'V') {
                    simg = "Resource/tier-icons/tier_icons/gold_v.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'IV') {
                    simg = "Resource/tier-icons/tier_icons/gold_iv.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'III') {
                    simg = "Resource/tier-icons/tier_icons/gold_iii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'II') {
                    simg = "Resource/tier-icons/tier_icons/gold_ii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'I') {
                    simg = "Resource/tier-icons/tier_icons/gold_i.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  }
                } else if (body[id][0].tier == 'SILVER') {
                  if (body[id][0].entries[i].division == 'V') {
                    simg = "Resource/tier-icons/tier_icons/silver_v.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'IV') {
                    simg = "Resource/tier-icons/tier_icons/silver_iv.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'III') {
                    simg = "Resource/tier-icons/tier_icons/silver_iii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'II') {
                    simg = "Resource/tier-icons/tier_icons/silver_ii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'I') {
                    simg = "Resource/tier-icons/tier_icons/silver_i.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  }
                } else if (body[id][0].tier == 'BRONZE') {
                  if (body[id][0].entries[i].division == 'V') {
                    simg = "Resource/tier-icons/tier_icons/bronze_v.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'IV') {
                    simg = "Resource/tier-icons/tier_icons/bronze_iv.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'III') {
                    simg = "Resource/tier-icons/tier_icons/bronze_iii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'II') {
                    simg = "Resource/tier-icons/tier_icons/bronze_ii.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  } else if (body[id][0].entries[i].division == 'I') {
                    simg = "Resource/tier-icons/tier_icons/bronze_i.png";
                    srank = body[id][0].tier + " " + body[id][0].entries[i].division;
                    slp = 'League Points: ' + body[id][0].entries[i].leaguePoints;
                  }
                }
              } else {
                simg = "Resource/tier-icons/tier_icons/unranked.png";
                srank = "Unranked";
                slp = 'League Points: N/A';
                swins = '0';
                sloss = '0';
              }


              if (body[id][1] !== undefined) {
                fwins = body[id][1].entries[x].wins;
                floss = body[id][1].entries[x].losses;
                if (body[id][1].tier == 'CHALLENGER') {
                  fimg = "Resource/tier-icons/base_icons/challenger.png";
                  frank = body[id][1].tier;
                  flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;
                } else if (body[id][1].tier == 'MASTER') {
                  fimg = "Resource/tier-icons/base_icons/master.png";
                  frank = body[id][1].tier;
                  flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                } else if (body[id][1].tier == 'DIAMOND') {
                  if (body[id][1].entries[x].division == 'V') {
                    fimg = "Resource/tier-icons/tier_icons/diamond_v.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'IV') {
                    fimg = "Resource/tier-icons/tier_icons/diamond_iv.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'III') {
                    fimg = "Resource/tier-icons/tier_icons/diamond_iii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'II') {
                    fimg = "Resource/tier-icons/tier_icons/diamond_ii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'I') {
                    fimg = "Resource/tier-icons/tier_icons/diamond_i.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  }
                } else if (body[id][1].tier == 'PLATINUM') {
                  if (body[id][1].entries[x].division == 'V') {
                    fimg = "Resource/tier-icons/tier_icons/platinum_v.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'IV') {
                    fimg = "Resource/tier-icons/tier_icons/platinum_iv.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'III') {
                    fimg = "Resource/tier-icons/tier_icons/platinum_iii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'II') {
                    fimg = "Resource/tier-icons/tier_icons/platinum_ii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;

                  } else if (body[id][1].entries[x].division == 'I') {
                    fimg = "Resource/tier-icons/tier_icons/platinum_i.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  }
                } else if (body[id][1].tier == 'GOLD') {
                  if (body[id][1].entries[x].division == 'V') {
                    fimg = "Resource/tier-icons/tier_icons/gold_v.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'IV') {
                    fimg = "Resource/tier-icons/tier_icons/gold_iv.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'III') {
                    fimg = "Resource/tier-icons/tier_icons/gold_iii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'II') {
                    fimg = "Resource/tier-icons/tier_icons/gold_ii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'I') {
                    fimg = "Resource/tier-icons/tier_icons/gold_i.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  }
                } else if (body[id][1].tier == 'SILVER') {
                  if (body[id][1].entries[x].division == 'V') {
                    fimg = "Resource/tier-icons/tier_icons/silver_v.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'IV') {
                    fimg = "Resource/tier-icons/tier_icons/silver_iv.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'III') {
                    fimg = "Resource/tier-icons/tier_icons/silver_iii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'II') {
                    fimg = "Resource/tier-icons/tier_icons/silver_ii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'I') {
                    fimg = "Resource/tier-icons/tier_icons/silver_i.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  }
                } else if (body[id][1].tier == 'BRONZE') {
                  if (body[id][1].entries[x].division == 'V') {
                    fimg = "Resource/tier-icons/tier_icons/bronze_v.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'IV') {
                    fimg = "Resource/tier-icons/tier_icons/bronze_iv.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'III') {
                    fimg = "Resource/tier-icons/tier_icons/bronze_iii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'II') {
                    fimg = "Resource/tier-icons/tier_icons/bronze_ii.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;


                  } else if (body[id][1].entries[x].division == 'I') {
                    fimg = "Resource/tier-icons/tier_icons/bronze_i.png";
                    frank = body[id][1].tier + " " + body[id][1].entries[x].division;
                    flp = 'League Points: ' + body[id][1].entries[x].leaguePoints;
                  }
                }
              } else {
                fimg = "Resource/tier-icons/tier_icons/unranked.png";
                frank = "Unranked";
                flp = 'League Points: N/A';
                fwins = '0';
                floss = '0';
              }

              if (body[id][0] !== undefined) {
                if (body[id][0].entries[i].miniSeries !== undefined) {
                  ss = "Series progress: ";
                  for (var ssLen = 0; ssLen < body[id][0].entries[i].miniSeries.progress.length; ssLen++) {
                    if (body[id][0].entries[i].miniSeries.progress[ssLen] == "W") {
                      ss += "<img src='Resource/won.png' alt='won' id='series'>"
                    } else if (body[id][0].entries[i].miniSeries.progress[ssLen] == "L") {
                      ss += "<img src='Resource/lost.png' alt='lost' id='series'>"
                    } else if (body[id][0].entries[i].miniSeries.progress[ssLen] == "N") {
                      ss += "<img src='Resource/draw.png' alt='draw' id='series'>"
                    }
                  }
                } else {
                  var ss = "";
                }
              }

              if (body[id][1] !== undefined) {
                if (body[id][1].entries[x].miniSeries !== undefined) {
                  fs = "Series progress: ";
                  for (var fsLen = 0; fsLen < body[id][1].entries[x].miniSeries.progress.length; fsLen++) {
                    if (body[id][1].entries[x].miniSeries.progress[fsLen] == "W") {
                      fs += "<img src='Resource/won.png' alt='won' id='series'>"
                    } else if (body[id][1].entries[x].miniSeries.progress[fsLen] == "L") {
                      fs += "<img src='Resource/lost.png' alt='lost' id='series'>"
                    } else if (body[id][1].entries[x].miniSeries.progress[fsLen] == "N") {
                      fs += "<img src='Resource/draw.png' alt='draw' id='series'>"
                    }
                  }
                } else {
                  var fs = "";
                }
              }

              var iconurl = "Resource/img/profileicon/" + profId + ".png";
              console.log('Request completed for ' + name);
              res.render('summoner', {
                title: name,
                summ: name,
                level: 'Level ' + level,
                simg: simg,
                srank: srank,
                swins: swins,
                sloss: sloss,
                slp: slp,
                ss: ss,
                fimg: fimg,
                frank: frank,
                flp: flp,
                fwins: fwins,
                stats: stats,
                floss: floss,
                icon: iconurl,
                fs: fs,
                bg: bg,
                games: games
              });

            } else if (response.statusCode == 404) {
              var iconurl = "Resource/img/profileicon/" + profId + ".png";
              res.render('summoner', {
                title: name,
                summ: name,
                level: 'Level ' + level,
                simg: "Resource/tier-icons/tier_icons/unranked.png",
                srank: "Unranked",
                slp: "League Points: N/A",
                ss: "",
                swins: 0,
                sloss: 0,
                fimg: "Resource/tier-icons/tier_icons/unranked.png",
                frank: "Unranked",
                flp: "League Points: N/A",
                fwins: 0,
                stats: stats,
                floss: 0,
                icon: iconurl,
                fs: "",
                bg: bg,
                games: games

              });
            } else {
              console.log(error);
            }


          });
        });
      } else if (response.statusCode == 404) {
        res.render('notfound', {
          title: 'League Site',
          summ: summ + ' not found',
          bg: bg
        });
      } else {
        console.log(error);
      }
    });
  });
});

app.get('*', function(req, res) {
  res.send('This is not the page you were looking for');
});

app.listen(3000, function() {
  console.log('The application is listening on localhost:3000');
});
