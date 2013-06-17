var jsonxml = require('jsontoxml');
var xmlopts = { escape: true,
             xmlHeader: true
        };

exports = module.exports = function () {
  return function formatXml(req, res, body) {

    var toplevel = req.url.split('/').slice(-1)[0];
    if (req.query.appid) { // 'ct' special case
      toplevel = toplevel.split('?')[0].toLowerCase();
      if (toplevel === 'app_user_ei_sync')
        toplevel += '_request';
      toplevel += '_rsp';
    } else {
      toplevel = 'ksdb_rsp';
    }

    var m2 = {};
    if (body instanceof Error) {
      // req.log.error(body);
      res.statusCode = body.statusCode || 500;
      m2.res_message = body.message;
      // m2.stack = body.stack; // remove in production
      m2.id = req._id;
      m2.res_code = res.statusCode;
    }
    else if ('string' == typeof(body) && body.length === 0) { // blank
      return('');
    }
    else if ('object' != typeof(body)) { // string
        m2.res_code = res.statusCode < 300 ? 0 : res.statusCode;
        m2.res_message = body;
        // m2.statusCode = res.statusCode;
    } else
    { // js object
      m2 = body;
      if (m2.res_code == undefined)
        m2.res_code = res.statusCode < 300 ? 0 : res.statusCode;
      m2.res_message = (m2.res_code === 0) ? 'OK' : 'Error';
    }

    var msg = {};
    msg[toplevel] = m2;
    var data = jsonxml(msg, xmlopts);
    res.setHeader('Content-Length', Buffer.byteLength(data, 'utf8'));
    return (data);
  };
};
