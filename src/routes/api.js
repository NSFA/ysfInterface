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
import ServiceInfo from '../models/serverInfo'
import apiList from '../models/apiList'

import jsonCtx from './ctx';
const router = new Router();

/**
 * 登录项
 */
router.post('/login', async(ctx, next) => {
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
router.get('/getProxy', async(ctx, next) => {
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
router.post('/setProxy', async(ctx, next) => {
    const requestData = ctx.request.body;
    await Setting.setProxy(requestData);
    ctx.body = {
        "result": "",
        "code": 200,
        "msg": "保存成功"
    }
});

/**
 * 获取服务器信息
 */
router.get('/getInfo', async(ctx, next) => {
    const info = await ServiceInfo.getInfo();
    ctx.body = {
        "result": {proxy_switch: info.status},
        "code": 200,
        "msg": "success"
    }
});

/**
 * 设置服务器信息
 */
router.post('/setInfo', async(ctx, next) => {
    const requestData = ctx.request.body;
    await ServiceInfo.setInfo(requestData);
    ctx.body = {
        "result": "",
        "code": 200,
        "msg": "设置成功"
    }
});

/**
 * 获取API列表
 */
router.get('/getApiList', async(ctx, next) => {
    const list = await apiList.getApiList();
    ctx.body = {
        "result": list,
        "code": 200,
        "msg": "列表在这里"
    }
});

/**
 * 添加API项
 */
router.post('/addApi', async(ctx, next) => {
    const requestData = ctx.request.body;
    const info = await apiList.addApi(requestData);
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg || "添加Api成功"
    }
});

/**
 * 删除API项
 */
router.post('/delApi', async(ctx, next) => {
    const requestData = ctx.request.body;
    const info = await apiList.delApi(requestData);
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg
    }
});

/**
 * 获取API项
 */
router.get('/getApi', async(ctx, next) => {
    const requestData = ctx.request.query;
    const info = await apiList.getApi(requestData);
    ctx.body = {
        "result": info.result || "",
        "code": info.code,
        "msg": info.msg
    }
});

export default router
