'use strict';

const DEFAULT_WEB_PORT = 8002; // port for web interface

const express = require('express'),
  url = require('url'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  path = require('path'),
  events = require('events'),
  qrCode = require('qrcode-npm'),
  util = require('./util'),
  certMgr = require('./certMgr'),
  wsServer = require('./wsServer'),
  juicer = require('juicer'),
  ip = require('ip'),
  co = require('co'),
  compress = require('compression');

const packageJson = require('../package.json');

/**
 *
 *
 * @class webInterface
 * @extends {events.EventEmitter}
 */
class webInterface extends events.EventEmitter {

  /**
   * Creates an instance of webInterface.
   *
   * @param {object} config
   * @param {number} config.webPort
   * @param {number} config.wsPort
   * @param {object} recorder
   *
   * @memberOf webInterface
   */
  constructor(config, recorder) {
    if (!recorder) {
      throw new Error('recorder is required for web interface');
    }
    super();
    const self = this;
    self.webPort = config.webPort || DEFAULT_WEB_PORT;
    self.recorder = recorder;
    self.config = config || {};

    self.app = null;
    self.server = null;
    self.wsServer = null;
  }

  start() {
    const self = this;
    const recorder = self.recorder;
    let wsPort;

    return co(function *() {
      // determine ws port
      wsPort = self.config.wsPort ? self.config.wsPort : yield util.getFreePort();
    }).then(() => {
      const ipAddress = ip.address(),
        // userRule = proxyInstance.proxyRule,
        webBasePath = 'web';
      let ruleSummary = '';
      let customMenu = [];

      try {
        ruleSummary = ''; //userRule.summary();
        customMenu = ''; // userRule._getCustomMenu();
      } catch (e) { }

      const myAbsAddress = 'http://' + ipAddress + ':' + self.webPort + '/',
        staticDir = path.join(__dirname, '../', webBasePath);

      const app = express();
      app.use(compress()); //invoke gzip
      app.use((req, res, next) => {
        res.setHeader('note', 'THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE');
        return next();
      });
      app.use(bodyParser.json());

      app.get('/latestLog', (req, res) => {
        recorder.getRecords(null, 10000, (err, docs) => {
          if (err) {
            res.end(err.toString());
          } else {
            res.json(docs);
          }
        });
      });

      app.get('/fetchBody', (req, res) => {
        const query = req.query;
        if (query && query.id) {
          recorder.getDecodedBody(query.id, (err, result) => {
            if (err || !result || !result.content) {
              res.json({});
            } else if (result.type && result.type === 'image' && result.mime) {
              if (query.raw) {
                //TODO : cache query result
                res.type(result.mime).end(result.content);
              } else {
                res.json({
                  id: query.id,
                  type: result.type,
                  ref: '/fetchBody?id=' + query.id + '&raw=true'
                });
              }
            } else {
              res.json({
                id: query.id,
                type: result.type,
                content: result.content
              });
            }
          });
        } else {
          res.end({});
        }
      });

      app.get('/fetchCrtFile', (req, res) => {
        const _crtFilePath = certMgr.getRootCAFilePath();
        if (_crtFilePath) {
          res.setHeader('Content-Type', 'application/x-x509-ca-cert');
          res.setHeader('Content-Disposition', 'attachment; filename="rootCA.crt"');
          res.end(fs.readFileSync(_crtFilePath, { encoding: null }));
        } else {
          res.setHeader('Content-Type', 'text/html');
          res.end('can not file rootCA ,plase use <strong>anyproxy --root</strong> to generate one');
        }
      });

      //make qr code
      app.get('/qr', (req, res) => {
        const qr = qrCode.qrcode(4, 'M'),
          targetUrl = myAbsAddress;

        qr.addData(targetUrl);
        qr.make();
        const qrImageTag = qr.createImgTag(4);
        const resDom = '<a href="__url"> __img <br> click or scan qr code to start client </a>'.replace(/__url/, targetUrl).replace(/__img/, qrImageTag);
        res.setHeader('Content-Type', 'text/html');
        res.end(resDom);
      });

      app.get('/api/getQrCode', (req, res) => {
        const qr = qrCode.qrcode(4, 'M'),
          targetUrl = myAbsAddress + 'fetchCrtFile';

        qr.addData(targetUrl);
        qr.make();
        const qrImageTag = qr.createImgTag(4);

        // resDom = '<a href="__url"> __img <br> click or scan qr code to download rootCA.crt </a>'.replace(/__url/,targetUrl).replace(/__img/,qrImageTag);
        // res.setHeader("Content-Type", "text/html");
        // res.end(resDom);

        const isRootCAFileExists = certMgr.isRootCAFileExists();
        res.json({
          status: 'success',
          url: targetUrl,
          isRootCAFileExists,
          qrImgDom: qrImageTag
        });
      });

      // response init data
      app.get('/api/getInitData', (req, res) => {
        const rootCAExists = certMgr.isRootCAFileExists();
        const rootDirPath = certMgr.getRootDirPath();
        const interceptFlag = false; //proxyInstance.getInterceptFlag(); TODO
        const globalProxyFlag = false; // TODO: proxyInstance.getGlobalProxyFlag();

        res.json({
          status: 'success',
          rootCAExists,
          rootCADirPath: rootDirPath,
          currentInterceptFlag: interceptFlag,
          currentGlobalProxyFlag: globalProxyFlag,
          ruleSummary: ruleSummary || '',
          ipAddress: util.getAllIpAddress(),
          port: '', //proxyInstance.proxyPort, // TODO
          wsPort,
          appVersion: packageJson.version
        });
      });

      app.post('/api/generateRootCA', (req, res) => {
        const rootExists = certMgr.isRootCAFileExists();
        if (!rootExists) {
          certMgr.generateRootCA(() => {
            res.json({
              status: 'success',
              code: 'done'
            });
          });
        } else {
          res.json({
            status: 'success',
            code: 'root_ca_exists'
          });
        }
      });

      // should not be available in in-build version
      // app.post('/api/toggleInterceptHttps', (req, res) => {
      //   const rootExists = certMgr.isRootCAFileExists();
      //   if (!rootExists) {
      //     certMgr.generateRootCA(() => {
      //       proxyInstance.setIntercept(req.body.flag);
      //       // Also inform the web if RootCa exists
      //       res.json({
      //         status: 'success',
      //         rootExists
      //       });
      //     });
      //   } else {
      //     proxyInstance.setIntercept(req.body.flag);
      //     res.json({
      //       status: 'success',
      //       rootExists
      //     });
      //   }
      // });

      // app.post('/api/toggleGlobalProxy', (req, res) => {
      //   const flag = req.body.flag;
      //   let result = {};
      //   result = flag ? proxyInstance.enableGlobalProxy() : proxyInstance.disableGlobalProxy();

      //   if (result.status) {
      //     res.json({
      //       status: 'failed',
      //       errorMsg: result.stdout
      //     });
      //   } else {
      //     res.json({
      //       status: 'success',
      //       isWindows: /^win/.test(process.platform)
      //     });
      //   }
      // });

      app.use((req, res, next) => {
        const indexTpl = fs.readFileSync(path.join(staticDir, '/index.html'), { encoding: 'utf8' }),
          opt = {
            rule: ruleSummary || '',
            customMenu: customMenu || [],
            wsPort,
            ipAddress: ipAddress || '127.0.0.1'
          };

        if (url.parse(req.url).pathname === '/') {
          res.setHeader('Content-Type', 'text/html');
          res.end(juicer(indexTpl, opt));
        } else {
          next();
        }
      });

      app.use(express.static(staticDir));

      //plugin from rule file
      const server = app.listen(self.webPort);

      self.app = app;
      self.server = server;
    }).then(() => {
      // start ws server
      self.wsServer = new wsServer({
        port: wsPort
      }, recorder);

      return self.wsServer.start();
    });
  }

  close() {
    this.server && this.server.close();
    this.wsServer && this.wsServer.closeAll();

    this.server = null;
    this.wsServer = null;
    this.proxyInstance = null;
  }
}

module.exports = webInterface;
