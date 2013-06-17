# KSDB is Keyless Signature Database with RESTish Web Interface

This software provides RESTish web interface for accessing the [KSI](http://www.openksi.org)
[service](http://www.guardtime.com/signatures/technology-overview).

[Examples!](http://ristik.github.com/ksdbjs/#examples)


## Features

- Easy integration, no need to store signature tokens at client-side
- Lightweight API, suitable for mobile devices
- Supports anything that can hash and create web request
- Still supports independent verification using downloaded token.

All great, but because document hash is the key (think Content Addressable Storage)
it is not possible to differentiate missing signature and modified document.
Please use the native API and store signature token next to the data if You can.


## Installation

1. Install and start MongoDB
2. Download and extract `ksdbjs`
3. `npm install .`
4. Adjust `config.json`
5. `node main.js`
6. Use reverse proxy for security and high availability, if necessary
7. Set up service, for example using [forever](https://github.com/nodejitsu/forever) and init.d/upstart/SMF script.


## API Docs

See /docs/index.restdown or http://ristik.github.com/ksdbjs/


---
Published under Apache license v. 2.0.
Copyright Guardtime AS 2013