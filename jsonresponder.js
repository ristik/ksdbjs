
exports = module.exports = function () {
  return function formatJSON(req, res, body) {

    if (body instanceof Error) {
      res.statusCode = body.statusCode || 500;

      // req.log.error(body);

      if (body.body) {
        // body.body.stack = body.stack; // remove in prod.
        body.body.id = req._id;
        body = body.body;
        body.res_code = res.statusCode < 300 ? 0 : res.statusCode;
        body.res_message = body.message;
        body.statusCode = res.statusCode;
      } else {
        body = { res_message: body.message,
                 res_code: res.statusCode
                 // stack: body.stack 
               };
      }
    } else if (Buffer.isBuffer(body)) {
      body = body.toString('base64');
    }
    else if ('string' == typeof(body) && body.length === 0) { // blank
      return('');
    } else if ('object' != typeof(body)) { // string
      body = {res_code: res.statusCode < 300 ? 0 : res.statusCode,
              res_message: body};
    } else { // Object
      if (body.res_code == undefined)
        body.res_code = res.statusCode < 300 ? 0 : res.statusCode;
      body.res_message = (body.res_code === 0) ? 'OK' : 'Error';

    }

    var data = JSON.stringify(body);
    res.setHeader('Content-Length', Buffer.byteLength(data));
    return (data);
  };
};
