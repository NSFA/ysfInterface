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

import jsonCtx from './ctx';
import apiEmmiter from '../proxy/emmiter';
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
    res.ok === 1 && apiEmmiter.emit('urlchange', requestData.url);
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
            apiEmmiter.emit('apilistadd', res.result);
        } else {
            apiEmmiter.emit('apilistedit', requestData);
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
    res.code === 200 && apiEmmiter.emit('apilistdel', requestData.id);
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
            apiEmmiter.emit('apireqlistadd', res.result);
        } else {
            apiEmmiter.emit('apireqlistedit', requestData);
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
    res.code === 200 && apiEmmiter.emit('apireqlistdel', requestData.id);
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
    ctx.body = res;
});

export default router
