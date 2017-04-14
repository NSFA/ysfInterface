'use strict';

const http = require('http'),
    https = require('https'),
    async = require('async'),
    color = require('colorful'),
    certMgr = require('./lib/certMgr'),
    Recorder = require('./lib/recorder'),
    logUtil = require('./lib/log'),
    util = require('./lib/util'),
    events = require('events'),
    wsServer = require('./lib/wsServer'),
    ThrottleGroup = require('stream-throttle').ThrottleGroup;

const T_TYPE_HTTP = 'http',
    T_TYPE_HTTPS = 'https',
    DEFAULT_TYPE = T_TYPE_HTTP;

const PROXY_STATUS_INIT = 'INIT';
const PROXY_STATUS_READY = 'READY';
const PROXY_STATUS_CLOSED = 'CLOSED';

/**
 *
 * @class ProxyCore
 * @extends {events.EventEmitter}
 */
class ProxyCore extends events.EventEmitter {

    /**
     * Creates an instance of ProxyCore.
     *
     * @param {object} config - configs
     * @param {number} config.port - port of the proxy server
     * @param {object} [config.rule=null] - rule module to use
     * @param {string} [config.type=http] - type of the proxy server, could be 'http' or 'https'
     * @param {strign} [config.hostname=localhost] - host name of the proxy server, required when this is an https proxy
     * @param {number} [config.throttle] - speed limit in kb/s
     * @param {boolean} [config.forceProxyHttps=false] - if proxy all https requests
     * @param {boolean} [config.silent=false] - if keep the console silent
     * @param {boolean} [config.dangerouslyIgnoreUnauthorized=false] - if ignore unauthorized server response
     * @param {object} [config.recorder] - recorder to use
     *
     * @memberOf ProxyCore
     */
    constructor(config) {
        super();
        config = config || {};

        this.status = PROXY_STATUS_INIT;
        this.proxyPort = config.port;
        this.wsPort = config.wsPort;
        this.proxyType = /https/i.test(config.type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP;
        this.proxyHostName = config.hostname || 'localhost';
        this.recorder = config.recorder;

        if (parseInt(process.versions.node.split('.')[0], 10) < 4) {
            throw new Error('node.js >= v4.x is required for anyproxy');
        } else if (config.forceProxyHttps && !certMgr.ifRootCAFileExists()) {
            throw new Error('root CA not found. can not intercept https');
        } else if (this.proxyType === T_TYPE_HTTPS && !config.hostname) {
            throw new Error('hostname is required in https proxy');
        } else if (!this.proxyPort) {
            throw new Error('proxy port is required');
        } else if (!this.recorder) {
            throw new Error('recorder is required');
        }

        this.httpProxyServer = null;
        this.requestHandler = null;

        // copy the rule to keep the original proxyRule independent
        this.proxyRule = config.rule || {};

        if (config.silent) {
            logUtil.setPrintStatus(false);
        }

        if (config.throttle) {
            logUtil.printLog('throttle :' + config.throttle + 'kb/s');
            const rate = parseInt(config.throttle, 10);
            if (rate < 1) {
                throw new Error('Invalid throttle rate value, should be positive integer');
            }
            global._throttle = new ThrottleGroup({rate: 1024 * rate}); // rate - byte/sec
        }

        // init recorder
        this.recorder = config.recorder;

        // init request handler
        const RequestHandler = util.freshRequire('./requestHandler');
        this.requestHandler = new RequestHandler({
            forceProxyHttps: !!config.forceProxyHttps,
            dangerouslyIgnoreUnauthorized: !!config.dangerouslyIgnoreUnauthorized
        }, this.proxyRule, this.recorder);
    }

    /**
     * start the proxy server
     *
     * @returns ProxyCore
     *
     * @memberOf ProxyCore
     */
    start() {
        const self = this;
        if (self.status !== PROXY_STATUS_INIT) {
            throw new Error('server status is not PROXY_STATUS_INIT, can not run start()');
        }
        async.series(
            [
                //creat proxy server
                function (callback) {
                    if (self.proxyType === T_TYPE_HTTPS) {
                        certMgr.getCertificate(self.proxyHostName, (err, keyContent, crtContent) => {
                            if (err) {
                                callback(err);
                            } else {
                                self.httpProxyServer = https.createServer({
                                    key: keyContent,
                                    cert: crtContent
                                }, self.requestHandler.userRequestHandler);
                                callback(null);
                            }
                        });
                    } else {
                        self.httpProxyServer = http.createServer(self.requestHandler.userRequestHandler);
                        callback(null);
                    }
                },

                //handle CONNECT request for https over http
                function (callback) {
                    self.httpProxyServer.on('connect', self.requestHandler.connectReqHandler);

                    callback(null);
                },

                //start proxy server
                function (callback) {
                    self.httpProxyServer.listen(self.proxyPort);
                    callback(null);
                },
            ],

            //final callback
            (err, result) => {
                if (!err) {
                    const tipText = (self.proxyType === T_TYPE_HTTP ? 'Http' : 'Https') + ' proxy started on port ' + self.proxyPort;
                    logUtil.printLog(color.green(tipText));

                    self.status = PROXY_STATUS_READY;
                    self.emit('ready');
                } else {
                    const tipText = 'err when start proxy server :(';
                    logUtil.printLog(color.red(tipText), logUtil.T_ERR);
                    logUtil.printLog(err, logUtil.T_ERR);
                    self.emit('error', {
                        error: err
                    });
                }
            }
        );

        return self;
    }


    /**
     * close the proxy server
     *
     * @returns ProxyCore
     *
     * @memberOf ProxyCore
     */
    close() {
        // clear recorder cache

        this.httpProxyServer && this.httpProxyServer.close();
        this.httpProxyServer = null;

        this.status = PROXY_STATUS_CLOSED;
        logUtil.printLog('server closed ' + this.proxyHostName + ':' + this.proxyPort);

        return this
    }
}

/**
 * start proxy server as well as recorder and wsServer
 */
class ProxyServer extends ProxyCore {
    /**
     *
     * @param {object} config - config
     *
     */
    constructor(config) {
        // prepare a recorder
        global.recorder = new Recorder();
        const recorder =global.recorder;
        const configForCore = Object.assign({
            recorder,
        }, config);

        super(configForCore);
        this.recorder = global.recorder;
        this.wsServer = null;
    }

    start() {
        super.start();
        // start wsServer
        if (this.wsPort) {
            this.wsServer = new wsServer({
                port: this.wsPort
            }, global.recorder);
            this.wsServer.start();
        }
    }

    close() {
        super.close();

        this.wsServer && this.wsServer.closeAll();

        if (global.recorder) {
            logUtil.printLog('clearing cache file...');
            global.recorder.clear();
        }

        this.wsServer = null;
        global.recorder = null;

        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }
}

module.exports.ProxyCore = ProxyCore;
module.exports.ProxyServer = ProxyServer;
module.exports.ProxyRecorder = Recorder;
module.exports.utils = {
    systemProxyMgr: require('./lib/systemProxyMgr'),
    certMgr,
};

