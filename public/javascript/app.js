/* jshint strict:true, esversion:5, es5:true */

window['user_context'] = {
  last_query: {}
};

var ivo_api = 'https://api.ivo.si';

$(document).ready(function () {
  getUsersLocation();
});

$("form#stdin").on('submit', function (e) {
  if (e.preventDefault) e.preventDefault();
  processInput($("input#text").val());
});

$("#microphone").on('click', function (e) {
  if (e.preventDefault) e.preventDefault();
  $("form#stdin").trigger("submit");
});

var getUsersLocation = function () {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setPosition);
  } else {

  }
};

var setPosition = function (location) {
  window.user_context['at'] = geoPositonToAt(location);
  processInput($("input#text").val());
};

var geoPositonToAt = function (geo) {
  return [_.get(geo, 'coords.longitude'), _.get(geo, 'coords.latitude')]
};

var processInput = function (text) {
  if (text.length === 0) return;
  var results = scenarios.map(processScenario.bind(null, text));
  window['user_context']['last_query'] = processNLPResults(results);
  executeRequest(window['user_context']['last_query']);
};


var wordToTokens = function (text) {
  return _.map(text.match(/("[^"]+"|[^"\s]+)/g), _.toLower);
};

var removeStopWords = function (words) {
  return words.filter(x => !~SI_STOP_WORDS.indexOf(x))
};

var processScenario = function (text, elem) {
  var result = elem(text);
  return result;
};

var processNLPResults = function (postResults) {
  var queryParams = _.reduce(postResults, _.extend);
  queryParams['maxDistance'] = 500000;
  return queryParams;
};

var executeRequest = function (queryParams) {
  queryParams['limit']=1;
  $.getJSON(ivo_api + '/stations?' + $.param(queryParams), function (results) {
    $("#data").html(JSON.stringify(enrichResults(results.stations), null, 2));
    renderResults(results);
  })
};

var enrichResults = function (results) {
  return results.map(function (result) {
    if (_.isNumber(result['distance'])) {
      var distance = (result['distance'] / 1000).toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];
      result['human_distance'] = distance+"km";
    }

    var lastQuery = _.get(window, 'user_context.last_query.services', {});
    var searchServicesArr = [];
    if(lastQuery !== {}) lastQuery = lastQuery.split(",");

    var servicesHuman = _.get(result, 'meta.services_humans', {});
    result['services_show'] = _.orderBy(_.keys(servicesHuman).map(function (key) {
      return {
        key: key,
        value: servicesHuman[key],
        found: _.includes(lastQuery, key) ? 0 : 1
      }
    }), 'found');

    var shopping_hours_humans = _.get(result, 'meta.shopping_hours_humans', {});
    result['shopping_hours_humans_array'] = _.keys(shopping_hours_humans).map(function(key) {
      return {key: key, value: shopping_hours_humans[key]}
    });

    var prices_human = _.get(result, 'prices', {});
    result['prices_human']= _.keys(prices_human).map(function (key) {
      return {key: key, value: prices_human[key]}
    });

    return result;
  })
};

var renderResults = function (results) {
  var template = $("#results_template").html();
  var templateScript = Handlebars.compile(template);
  $("#data").html(templateScript(results));
};

var scenarios = [
  function (text) { /* Services */
    var words = removeStopWords(wordToTokens(text));
    services = [];
    _.keys(SERVICES_MAP).forEach(function (key) {
      words.forEach(function (word) {
        if (word.match(SERVICES_MAP[key])) services.push(key);
      });
    });
    return {services: _.uniq(services).join(",")}
  },
  function (text) { /* Locations */
    var at = _.get(window, 'user_context.at', undefined);
    at = (!_.isUndefined(at)) ? at.join(',') : {};
    return {at: at}
  }
  //
];

var SERVICES_MAP = {
  'kava_na_poti': /kava|kave|kavo/i,
  'q_max_95': /bencin|qmax/i,
  'q_max_100': /bencin|qmax/i,
  'q_max_diesel': /diesel|nafta|dizl|disl/i,
  'menjava_motornega_olja': /olje|menjava/i,
  'faks': /faks|fax/i,
  'caj_na_poti': /čaj/i,
  'trgovine_hip_hop': /trgovina/i,
  'posta': /pošta|pošto|pošljem/i,
  'pocitek': /počitek|utrujen/i,
  'bankomat': /denar|bankomat/i,
  'avtomatska_avtopralnica': /avtomatska|pralnica|avtopralnica|perem/i,
  // 'rocna_avtopralnica': /rocna|pralnica|avtopralnica|perem/i,
  'uta': /uta/i,
  'sesalec': /sesalec|sesanje|čiščenje/i,
  'wifi': /wifi|wi\-fi|internet|wajfi/i,
  'foto_na_poti': /foto|fotografija|razvijanje/i,
  'gotovinski_terminal_sportne_stave': /stave|stava/i,
  'fresh': /hamburger|burek|bureka|tortilja|smoothie|smuti|pizza|pica|sendvič|rogljiček|lačen|lačna|lačni/i,
  'urbana': /urbana|urbano/i
};

var SI_STOP_WORDS = ["a", "ali", "april", "avgust", "b", "bi", "bil", "bila", "bile", "bili", "bilo",
  "biti", "blizu", "bo", "bodo", "bojo", "bolj", "bom", "bomo", "boste", "bova", "boš", "brez", "c", "cel",
  "cela", "celi", "celo", "d", "da", "daleč", "dan", "danes", "datum", "december", "deset", "deseta", "deseti",
  "deseto", "devet", "deveta", "deveti", "deveto", "do", "dober", "dobra", "dobri", "dobro", "dokler", "dol",
  "dolg", "dolga", "dolgi", "dovolj", "drug", "druga", "drugi", "drugo", "dva", "dve", "e", "eden", "en", "ena",
  "ene", "eni", "enkrat", "eno", "etc.", "f", "februar", "g", "g.", "ga", "ga.", "gor", "gospa", "gospod", "h",
  "halo", "i", "idr.", "ii", "iii", "in", "iv", "ix", "iz", "j", "januar", "jaz", "je", "ji", "jih", "jim", "jo",
  "julij", "junij", "jutri", "k", "kadarkoli", "kaj", "kajti", "kako", "kakor", "kamor", "kamorkoli", "kar",
  "karkoli", "katerikoli", "kdaj", "kdo", "kdorkoli", "ker", "ki", "kje", "kjer", "kjerkoli", "ko", "koder",
  "koderkoli", "koga", "komu", "kot", "kratek", "kratka", "kratke", "kratki", "l", "lahka", "lahke", "lahki",
  "lahko", "le", "lep", "lepa", "lepe", "lepi", "lepo", "leto", "m", "maj", "majhen", "majhna", "majhni",
  "malce", "malo", "manj", "marec", "me", "med", "medtem", "mene", "mesec", "mi", "midva", "midve",
  "mnogo", "moj", "moja", "moje", "mora", "morajo", "moram", "moramo", "morate", "moraš", "morem",
  "mu", "n", "na", "nad", "naj", "najina", "najino", "najmanj", "naju", "največ", "nam", "narobe",
  "nas", "nato", "nazaj", "naš", "naša", "naše", "ne", "nedavno", "nedelja", "nek", "neka", "nekaj",
  "nekatere", "nekateri", "nekatero", "nekdo", "neke", "nekega", "neki", "nekje", "neko", "nekoga",
  "nekoč", "ni", "nikamor", "nikdar", "nikjer", "nikoli", "nič", "nje", "njega", "njegov", "njegova",
  "njegovo", "njej", "njemu", "njen", "njena", "njeno", "nji", "njih", "njihov", "njihova", "njihovo",
  "njiju", "njim", "njo", "njun", "njuna", "njuno", "no", "nocoj", "november", "npr.", "o", "ob", "oba",
  "obe", "oboje", "od", "odprt", "odprta", "odprti", "okoli", "oktober", "on", "onadva", "one", "oni",
  "onidve", "osem", "osma", "osmi", "osmo", "oz.", "p", "pa", "pet", "peta", "petek", "peti", "peto",
  "po", "pod", "pogosto", "poleg", "poln", "polna", "polni", "polno", "ponavadi", "ponedeljek", "ponovno",
  "potem", "povsod", "pozdravljen", "pozdravljeni", "prav", "prava", "prave", "pravi", "pravo", "prazen",
  "prazna", "prazno", "prbl.", "precej", "pred", "prej", "preko", "pri", "pribl.", "približno", "primer",
  "pripravljen", "pripravljena", "pripravljeni", "proti", "prva", "prvi", "prvo", "r", "ravno", "redko",
  "res", "reč", "s", "saj", "sam", "sama", "same", "sami", "samo", "se", "sebe", "sebi", "sedaj",
  "sedem", "sedma", "sedmi", "sedmo", "sem", "september", "seveda", "si", "sicer", "skoraj", "skozi", "slab", "smo", "so",
  "sobota", "spet", "sreda", "srednja", "srednji", "sta", "ste", "stran", "stvar", "sva", "t", "ta", "tak",
  "taka", "take", "taki", "tako", "takoj", "tam", "te", "tebe", "tebi", "tega", "težak", "težka", "težki", "težko",
  "ti", "tista", "tiste", "tisti", "tisto", "tj.", "tja", "to", "toda", "torek", "tretja", "tretje", "tretji", "tri",
  "tu", "tudi", "tukaj", "tvoj", "tvoja", "tvoje", "u", "v", "vaju", "vam",
  "vas", "vaš", "vaša", "vaše", "ve", "vedno", "velik", "velika", "veliki", "veliko", "vendar", "ves", "več", "vi",
  "vidva", "vii", "viii", "visok", "visoka", "visoke", "visoki", "vsa", "vsaj", "vsak", "vsaka", "vsakdo",
  "vsake", "vsaki", "vsakomur", "vse", "vsega", "vsi", "vso",
  "včasih", "včeraj", "x", "z", "za", "zadaj", "zadnji", "zakaj", "zaprta", "zaprti", "zaprto", "zdaj", "zelo",
  "zunaj", "č", "če", "često", "četrta", "četrtek", "četrti", "četrto", "čez", "čigav", "š", "šest", "šesta",
  "šesti", "šesto", "štiri", "ž", "že"];
