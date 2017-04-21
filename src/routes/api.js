/**
 * api接口
 * Created by qingze
 * Date: 2017/3/24
 * Time: 下午4:49
 **/
import Router from 'koa-router'
import qrCode from 'qrcode-npm'
import ip from 'ip'
import fs from 'fs'
import {ThrottleGroup} from 'stream-throttle'

import User from '../models/user';
import Setting from '../models/setting'
import apiResList from '../models/apiResList'
import apiReqList from '../models/apiReqList'

import nedb from '../models/nebd'

import certMgr from'../../proxy/lib/certMgr'
import logUtil from'../../proxy/lib/log'
import util from'../../proxy/lib/util'

import jsonCtx from './ctx';

const router = new Router();
/**
 * 登录(简陋)
 */
router.post('/login', async (ctx, next) => {
    const req = ctx.request.body;
    const res = await User.getUser(req.account);

    if (res && res.password === req.password) {
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
    const req = ctx.request.body;
    const res = await Setting.setProxy(req);

    if (req.throttle) {
        const rate = parseInt(req.throttle, 10);
        if (rate < 1) {
            throw new Error('Invalid throttle rate value, should be positive integer');
        }
        global._throttle = new ThrottleGroup({rate: 1024 * rate}); // rate - byte/sec
        logUtil.printLog(`限速 ${rate} kb/s`)
    } else {
        global._throttle = null; // null
        logUtil.printLog(`取消限速`)
    }

    ctx.body = res;
});

/**
 * 获取API列表
 */
router.get('/getApiList', async (ctx, next) => {
    ctx.body = await apiResList.getApiList();
});

/**
 * 添加API项
 */
router.post('/addApi', async (ctx, next) => {
    const req = ctx.request.body;
    ctx.body = await apiResList.addApi(req);
});

/**
 * 删除API项
 */
router.post('/delApi', async (ctx, next) => {
    const req = ctx.request.body;
    ctx.body = await apiResList.delApi(req);
});

/**
 * 获取API项
 */
router.get('/getApi', async (ctx, next) => {
    const req = ctx.request.query;
    ctx.body = await apiResList.getApi(req);
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
    const req = ctx.request.body;
    ctx.body = await apiReqList.addReqApi(req);
});

/**
 * 删除API项
 */
router.post('/delReqApi', async (ctx, next) => {
    const req = ctx.request.body;
    ctx.body = await apiReqList.delReqApi(req);
});

/**
 * 获取API项
 */
router.get('/getReqApi', async (ctx, next) => {
    const req = ctx.request.query;
    ctx.body = await apiReqList.getReqApi(req)
});

/**
 * 设置api状态
 */
router.post('/setApiStatus', async (ctx, next) => {
    const req = ctx.request.body;
    let res;

    switch(req.list){
        case "req":
            res = await apiReqList.updateStatus(req);
            break;
        case "res":
            res = await apiResList.updateStatus(req);
            break;
        default:
            res={};
            logUtil.printLog('未存在当前类型',logUtil.T_ERR);
            break;
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
        ctx.body = 'can not file rootCA,please retry';
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
