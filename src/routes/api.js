/**
 * api接口
 * Created by qingze
 * Date: 2017/3/24
 * Time: 下午4:49
 **/
import Router from 'koa-router'
import User from '../models/user';
import Setting from '../models/setting'
import apiList from '../models/apiList'
import apiReqList from '../models/apiReqList'
import certMgr from'../../proxy/lib/certMgr'
import util from'../../proxy/lib/util'
import jsonCtx from './ctx';
import emitter from '../proxy/emitter'
import qrCode from 'qrcode-npm'
import {ThrottleGroup} from 'stream-throttle'
import logUtil from'../../proxy/lib/log'
import ip from 'ip'
import fs from 'fs'
import nedb from '../models/nebd'
const router = new Router();
/**
 * 登录
 */
router.post('/login', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await User.getUser(requestData.account);
    if (res && res.password === requestData.password) {
        ctx.cookies.set(
            'login', true, {
                maxAge: 60 * 60 * 1000 * 2, //两小时
                httpOnly: false,
                overwrite: false
            }
        );
        ctx.body = jsonCtx.success;
    } else {
        ctx.body = jsonCtx.fail;
    }
});

/**
 * 获取AnyProxy设置
 */
router.get('/getProxy', async (ctx, next) => {
    ctx.body = await Setting.getProxy()
});

/**
 * 设置AnyProxy
 */
router.post('/setProxy', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await Setting.setProxy(requestData);
    emitter.emit('urlchange', requestData.url);
    if (requestData.throttle) {
        const rate = parseInt(requestData.throttle, 10);
        if (rate < 1) {
            throw new Error('Invalid throttle rate value, should be positive integer');
        }
        global._throttle = new ThrottleGroup({rate: 1024 * rate}); // rate - byte/sec

        logUtil.printLog(`限速 ${rate} kb/s`)
    }else{
        global._throttle = null; // rate - byte/sec
        logUtil.printLog(`取消限速`)
    }
    ctx.body = res;
});

/**
 * 获取API列表
 */
router.get('/getApiList', async (ctx, next) => {
    ctx.body = await apiList.getApiList();
});

/**
 * 添加API项
 */
router.post('/addApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await apiList.addApi(requestData);
    if (res.code === 200) {
        if (requestData.id === -1) {
            emitter.emit('apilistadd', res.result);
        } else {
            emitter.emit('apilistedit', requestData);
        }
    }
    ctx.body = res;
});

/**
 * 删除API项
 */
router.post('/delApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await apiList.delApi(requestData);
    res.code === 200 && emitter.emit('apilistdel', requestData.id);
    ctx.body = res;
});

/**
 * 获取API项
 */
router.get('/getApi', async (ctx, next) => {
    const requestData = ctx.request.query;
    ctx.body = await apiList.getApi(requestData);
});


/**
 * 获取API列表
 */
router.get('/getReqApiList', async (ctx, next) => {
    ctx.body = await apiReqList.getReqApiList();
});

/**
 * 添加API项
 */
router.post('/addReqApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await apiReqList.addReqApi(requestData);
    if (res.code === 200) {
        if (requestData.id === -1) {
            emitter.emit('apireqlistadd', res.result);
        } else {
            emitter.emit('apireqlistedit', requestData);
        }
    }
    ctx.body = res;
});

/**
 * 删除API项
 */
router.post('/delReqApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const res = await apiReqList.delReqApi(requestData);
    res.code === 200 && emitter.emit('apireqlistdel', requestData.id);
    ctx.body = res;
});

/**
 * 获取API项
 */
router.get('/getReqApi', async (ctx, next) => {
    const requestData = ctx.request.query;
    ctx.body = await apiReqList.getReqApi(requestData)
});

/**
 * 设置api状态
 */
router.post('/setApiStatus', async (ctx, next) => {
    const req = ctx.request.body;
    let res;
    if (req.list === "req") {
        res = await apiReqList.updateStatus(req);
    } else {
        res = await apiList.updateStatus(req);
    }
    if (res.code === 200) {
        emitter.emit('apistatus', req);
    }
    ctx.body = res;
});

/**
 * 获取初始化信息
 */
router.get('/getInitData', async (ctx, next) => {
    const rootCAExists = certMgr.isRootCAFileExists();
    const rootDirPath = certMgr.getRootDirPath();
    const interceptFlag = false;
    const globalProxyFlag = false;
    const setting = await Setting.getProxy();

    ctx.body = {
        status: 'success',
        rootCAExists,
        rootCADirPath: rootDirPath,
        currentInterceptFlag: interceptFlag,
        currentGlobalProxyFlag: globalProxyFlag,
        ipAddress: util.getAllIpAddress(),
        port: setting.result.anyproxy_port,
        wsPort: setting.result.ws_port
    };
});

/**
 * 获取列表
 */
router.get('/latestLog', async (ctx, next) => {
    ctx.body = await nedb.latestLog();
});

/**
 * 获取请求内容
 */
router.get('/getReqBody', async (ctx, next) => {
    const query = ctx.request.query;
    const result = await nedb.getLogBody(query.id);
    if (!result || !result.content) {
        ctx.body = {};
    } else if (result.type && result.type === 'image' && result.mime) {
        if (query.raw) {
            ctx.type = result.mime;
            ctx.body = result.content;
        } else {
            ctx.body = {
                id: query.id,
                type: result.type,
                ref: '/api/getReqBody?id=' + query.id + '&raw=true'
            };
        }
    } else {
        ctx.body = {
            id: query.id,
            type: result.type,
            content: result.content
        };
    }

});

/**
 * 获取证书
 */
router.get('/fetchCrtFile', (ctx, next) => {
    const _crtFilePath = certMgr.getRootCAFilePath();
    if (_crtFilePath) {
        ctx.set('Content-Type', 'application/x-x509-ca-cert');
        ctx.set('Content-Disposition', 'attachment; filename="rootCA.crt"');
        ctx.body = fs.readFileSync(_crtFilePath, {encoding: null});
    } else {
        ctx.set('Content-Type', 'text/html');
        ctx.body = 'can not file rootCA ,plase use <strong>anyproxy --root</strong> to generate one';
    }
});

/**
 * 获取证书信息及下载链接
 */
router.get('/getQrCode', async (ctx, next) => {
    const ipAddress = ip.address();
    const targetUrl = 'http://' + ipAddress + '/api/fetchCrtFile';
    const qr = qrCode.qrcode(4, 'M');
    qr.addData(targetUrl);
    qr.make();
    const qrImageTag = qr.createImgTag(4);
    const isRootCAFileExists = certMgr.isRootCAFileExists();

    ctx.body = {
        status: 'success',
        url: targetUrl,
        isRootCAFileExists,
        qrImgDom: qrImageTag
    };
});

export default router
