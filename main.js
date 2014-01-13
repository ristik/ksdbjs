/*jshint indent:2 */
var restify = require('restify');
var bunyan = require('bunyan');
var fs = require('fs'), url = require('url');
var ksdb = require('./ksdb');

var xmlBodyParser = require('./xmlbodyparser');
var xmlresponder  = require('./xmlresponder');
var jsonresponder = require('./jsonresponder');

var appname = 'ksdb';
var appver  = '0.3.1';

var conf = JSON.parse(fs.readFileSync(__dirname + '/config.json', encoding="utf8")); // may throw

var baseurl = conf.baseurl || '/ksdb';


if (conf.apimod) {
  appver = appver + conf.apimod;
}

if (conf.timezone) {
  // override JSON.stringify formatting:
  process.env.TZ = conf.timezone;
  Date.prototype.toJSON = function(d) {return this.toLocaleString();};
}

var logger = bunyan.createLogger({name: appname,
                          level: conf.loglevel || 'warn',
                          stream: process.stdout,
                          serializers: bunyan.stdSerializers});

var server = restify.createServer({
  name:    appname,
  version: appver,
  log:      logger,
  formatters: {
    'application/xml': xmlresponder(),
    'application/json': jsonresponder()   //customized error handling
  }
});

server.use(restify.acceptParser(  // do not use embedded parsers
   [ 'application/json',
     'application/xml',
     'application/octet-stream',
     'text/plain' ]));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(xmlBodyParser());

ksdb.init(conf, logger);

server.on('after', function (req, res, route, error) {
  var plah = {req: req,
          req_data: req._body,
          req_body: req.body,
          res: res,
          res_body: res._body instanceof Buffer ? "a Buffer" : res._body,
          res_data: res._data instanceof Buffer ? "a Buffer" : res._data};
  if (error) {
    req.log.error(error);
    req.log.error(plah, "after");
  } else
    req.log.info(plah, "after");
});

if (conf.apimod === 'ct') {
  // customer specific api
  server.get(baseurl + '/download', ksdb.download);
  server.get(baseurl + '/verify',   ksdb.verify);
  server.get(baseurl + '/create',   ksdb.sign);
  server.get(baseurl + '/param', ksdb.param);

  var dummyhandler = function (req, res, next) {
    res.setHeader('content-type', 'application/xml');
    res.send({res_code: 0, res_message: '成功'});
    return next();
  };
  server.post('/Enabler/app_ei_sync', dummyhandler);
  server.post('/Enabler/app_status_sync', dummyhandler);
  server.post('/Enabler/app_user_ei_sync', dummyhandler);
  server.post('/Enabler/resource_sync', dummyhandler);

} else {
  // more 'restful' interface for gereral consumption
  server.get(baseurl + '/:hash/param',  ksdb.param);
  server.get(baseurl + '/:hash/download',  ksdb.download);
  server.get(baseurl + '/:hash', ksdb.verify);
  server.put(baseurl + '/:hash', ksdb.sign);
}

server.listen(conf.listenport || 8080, function () {
  logger.info('%s %s listening at %s', server.name, server.versions, server.url);
});
