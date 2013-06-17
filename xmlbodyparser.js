var xml2js = require('xml2js');

var parseroptions = { explicitArray: false,
                      ignoreAttrs:   true,
                      async:         true
    };
var parser = new xml2js.Parser(parseroptions);


exports = module.exports = function () {
  return function xml(req, res, next) {

    if (req.method === 'HEAD' || req.method === 'GET')
      return next();

    if (req.contentLength() === 0 && !req.isChunked())
      return next();
    // console.log("xmlbodyparser1: " + req.getContentType());

    if (req.getContentType() !== 'application/xml' || !req.body)
      return next();

    var enc = req.header('content-type') || '';
    enc = enc.split(';')[1] || 'charset=utf8';
    enc = enc.split('charset=')[1] || 'utf8';
    req.setEncoding(enc);

    // crap, hangs when xml is not terminated. bug in sax-js?
    if (req.body instanceof Buffer)
      req.body = req.body.toString();
    //console.log("BLAAAAAA");
    //console.log(req.body);
    parser.parseString(req.body, function (err, json) {
      if (err) {
        err.statusCode = 400;
        return next(err);
      } else {
        req._body = req.body;
        req.body = json;
      }
      next();
    });
  };
};
