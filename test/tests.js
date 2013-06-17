var vows = require('vows');
var assert = require('assert');
var spec = require('vows/lib/vows/reporters/spec');
var gt = require('guardtime');
var fs = require('fs');

var xml2js = require('xml2js');
var xml = new xml2js.Parser();
var client = require('request');

function ksdb() {}

function assertStatus(status) {
  return function(err, res, body) {
    if (!res) {
      assert.ok(res);
    } else if (status instanceof RegExp) {
      assert.ok(String(res.statusCode).match(status));
    } else {
      if(res.statusCode != status && body) {  // wtf?
      }
      assert.equal(res.statusCode, status);
    }
  };
}

var ctmod = false; // API changed if ctmod=true

ksdb.req = function(method, hash, path, algorithm, type, callback) {

    var request = 'http://localhost:8080/ksdb/' +
      (ctmod ?
        path + '?hash=' + hash +(algorithm ? '&algorithm=' + algorithm : '')
        :
        hash + (path || '') +(algorithm ? '?algorithm=' + algorithm : ''));
    console.log('req: ' + request);
    var options = {
      uri:request,
      method: method
    };
    if(type) {
      options.headers = {'Accept': type};
      options.encoding = null;
      options.json = false;
    } else {
      options.json = true;
    }

    client(options, function(err, res, body){
      if(err) callback(err, res, body);
      callback(err, res, body);
    });

};

ksdb.create = function(hash, algorithm, type, callback) {
  if (ctmod)
    return ksdb.req('get', hash, 'create', algorithm, type, callback);
  else
    return ksdb.req('put', hash, '', algorithm, type, callback);
};

ksdb.getSignature = function(hash, algorithm, type, callback) {
  var path = '/download';
  if (ctmod)
    return ksdb.req('get', hash, 'verify', algorithm, type, callback);
  else
    return ksdb.req('get', hash, path, algorithm, type, callback);
};

ksdb.verify = function(hash, algorithm, type, callback) {
  if (ctmod)
    return ksdb.req('get', hash, 'verify', algorithm, type, callback);
  else
    return ksdb.req('get', hash, '', algorithm, type, callback);
};

var testHash = '043a718774c572bd8a25adbeb1bfcd5c0256ae11cecf9f9c3f925d0e52beaf89';
var testHashRIPEMD160 = '0bdc9d2d256b3ee9daae347be6f4dc835a467ffe';
var testHashSHA512 = '1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75';
var testHashFalse = '043a748774c572bd8a5d0e52beaf89';

var FullBackupSuite = vows.describe('ksdb tests').addBatch({
  "create with default algorithm": {
    topic: function(){
      var callback = this.callback;
      ksdb.create(testHash, undefined, false, callback);
    },
    'Expects 2xx': assertStatus(/2../)
  }
}).addBatch({
  "create with RIPEMD160": {
    topic: function(){
      var callback = this.callback;
      ksdb.create(testHashRIPEMD160, 'RIPEMD160', false, callback);
    },
    'Expects 2xx': assertStatus(/2../)
  }
}).addBatch({
  "create with SHA512": {
    topic: function(){
      var callback = this.callback;
      ksdb.create(testHashSHA512, 'SHA512', false, callback);
    },
    'Expects 2xx': assertStatus(/2../)
  }
}).addBatch({
  "create with incorrect hash": {
    topic: function(){
      var callback = this.callback;
      ksdb.create(testHashFalse, undefined, false, callback);
    },
    'Expects 409': assertStatus(409)
  }
}).addBatch({
  "getSig": {
    topic: function() {
      var callback = this.callback;
      ksdb.getSignature(testHash, undefined, 'application/octet-stream', callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      assert.ok(body);
    }
  }
}).addBatch({
  "getSig with local verification": {
    topic: function() {
      var callback = this.callback;
      ksdb.getSignature(testHash, undefined, 'application/octet-stream', callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      assert.ifError(err);
      b = new Buffer(testHash.length/2);

      for(i=0,a=0;i<testHash.length;i += 2,a++){
        b.writeUInt8(parseInt(testHash.substr(i, 2), 16), a);
      }
      var ts = new gt.TimeSignature(body);
      console.log(ts.getRegisteredTime());
      gt.verifyHash(b, 'SHA256', ts, function(err, res){
        assert.ifError(err);
        assert.ok(res);
      });
    }
  }
}).addBatch({
  "getSig with RIPEMD160": {
    topic: function() {
      var callback = this.callback;
      ksdb.getSignature(testHashRIPEMD160, 'RIPEMD160', 'application/octet-stream', callback);
    },
    'Expects 20x': assertStatus(/20./),
    'check response': function(err, res, body){
      assert.ok(body);
    }
  }
}).addBatch({
  "getSig with SHA512": {
    topic: function() {
      var callback = this.callback;
      ksdb.getSignature(testHashSHA512, 'SHA512', 'application/octet-stream', callback);
    },
    'Expects 20x': assertStatus(/20./),
    'check response': function(err, res, body){
      assert.ok(body);
    }
  }
}).addBatch({
  "getSig with incorrect hash": {
    topic: function() {
      var callback = this.callback;
      ksdb.getSignature(testHashFalse, undefined, 'application/octet-stream', callback);
    },
    'Expects 40x': assertStatus(/40./),
    'check response': function(err, res, body){
      assert.ok(body);
    }
  }
}).addBatch({
  "verify": {
    topic: function() {
      var callback = this.callback;
      ksdb.verify(testHash, undefined, false, callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      assert.ok(body.verification_status > 0);
      assert.ok(body.res_code === 0);
      assert.ok(body.res_message == 'OK');
    }
  }
}).addBatch({
  "verify with RIPEMD160": {
    topic: function() {
      var callback = this.callback;
      ksdb.verify(testHashRIPEMD160, 'RIPEMD160', false, callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      assert.ok(body.verification_status > 0);
    }
  }
}).addBatch({
  "verify with SHA512": {
    topic: function() {
      var callback = this.callback;
      ksdb.verify(testHashSHA512, 'SHA512', false, callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      assert.ok(body.verification_status > 0);
    }
  }
}).addBatch({
  "verify with XML": {
    topic: function() {
      var callback = this.callback;
      ksdb.verify(testHash, undefined, 'application/xml', callback);
    },
    'Expects 200': assertStatus(200),
    'check response': function(err, res, body){
      xml.parseString(body, function (err, r) {
          if (ctmod)
            assert.ok(r.verify_rsp.verification_status > 0);
          else
            assert.ok(r.ksdb_rsp.verification_status > 0);
      });
    }
  }
}).addBatch({
  "verify with incorrect hash": {
    topic: function() {
      var callback = this.callback;
      ksdb.verify(testHashFalse, undefined, false, callback);
    },
    'Expects 40x': assertStatus(/40./),
    'check response': function(err, res, body){
      console.log(body);
      assert.equal(body.result, undefined);
    }
  }
}).run({reporter:spec});
