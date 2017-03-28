/**
 * api接口
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/24
 * Time: 下午4:49
 **/
import Router from 'koa-router'
import User from '../models/user';
import Setting from '../models/setting'
import apiList from '../models/apiList'
import proxySet from '../proxy'
import AnyProxy from 'anyproxy'
import jsonCtx from './ctx';
import apiEmiiter from '../proxy/emmiter';
const router = new Router();
/**
 * 登录项
 */
router.post('/login', async (ctx, next) => {
    const requestData = ctx.request.body;
    const info = await User.getUser(requestData.account);
    if (info && info.password === requestData.password) {
        ctx.cookies.set(
            'login', true, {
                maxAge: 60 * 60 * 1000,
                httpOnly: false,
                overwrite: false
            }
        );
        ctx.body = jsonCtx.loginSuccess;
    } else {
        ctx.body = jsonCtx.loginFailed;
    }
});

/**
 * 获取AnyProxy设置
 */
router.get('/getProxy', async (ctx, next) => {
    const result = await Setting.getProxy();
    ctx.body = {
        "result": result,
        "code": 200,
        "msg": "success"
    }
});

/**
 * 设置AnyProxy
 */
router.post('/setProxy', async (ctx, next) => {
    if (global.serverStatus) {
        ctx.body = jsonCtx.err8000;
        return;
    }
    const requestData = ctx.request.body;
    const settingRes = await Setting.setProxy(requestData);
    ctx.body = {
        "result": settingRes,
        "code": settingRes.ok === 1 ? 200 : 8000,
        "msg": settingRes.ok === 1 ? "保存成功" : "保存失败"
    }
});

/**
 * 获取服务器信息
 */
router.get('/getInfo', async (ctx, next) => {
    ctx.body = {
        "result": {proxy_switch: global.serverStatus},
        "code": 200,
        "msg": "success"
    }
});

/**
 * 设置服务器信息
 */
router.post('/setInfo', async (ctx, next) => {
    const requestData = ctx.request.body;
    if (global.serverStatus === requestData.status) {
        ctx.body = jsonCtx.err8001;
        return;
    }
    global.serverStatus = !global.serverStatus;
    if (global.serverStatus) {
        const options = await proxySet.getSetInfo();
        global.proxySvr = new AnyProxy.ProxyServer(options);
        global.proxySvr.start();
    } else {
        global.proxySvr.close();
    }
    ctx.body = jsonCtx.setSuccess;
});

/**
 * 获取API列表
 */
router.get('/getApiList', async (ctx, next) => {
    const list = await apiList.getApiList();
    ctx.body = {
        "result": list,
        "code": 200,
        "msg": "Api列表在这里"
    }
});

/**
 * 添加API项
 */
router.post('/addApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const info = await apiList.addApi(requestData);
    if (info.code === 200) {
        if (requestData.id === -1) {
            apiEmiiter.emit('apilistadd', info.result);
        } else {
            apiEmiiter.emit('apilistedit', requestData);
        }
    }
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg
    }
});

/**
 * 删除API项
 */
router.post('/delApi', async (ctx, next) => {
    const requestData = ctx.request.body;
    const info = await apiList.delApi(requestData);
    info.code === 200 && apiEmiiter.emit('apilistdel', requestData.id);
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg
    }
});

/**
 * 获取API项
 */
router.get('/getApi', async (ctx, next) => {
    const requestData = ctx.request.query;
    const info = await apiList.getApi(requestData);
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg
    }
});

export default router
