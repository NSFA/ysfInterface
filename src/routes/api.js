import Router from 'koa-router'
import User from '../models/user';
import Setting from '../models/setting'
import ServiceInfo from '../models/serverInfo'

import jsonCtx from './ctx';
const router = new Router();

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

router.get('/getProxy', async(ctx, next) => {
    const result = await Setting.getProxy();
    ctx.body = {
        "result": result,
        "code": 200,
        "msg": "success"
    }
});

router.post('/setProxy', async(ctx, next) => {
    const requestData = ctx.request.body;
    await Setting.setProxy(requestData);
    ctx.body = {
        "result": "success",
        "code": 200,
        "msg": "保存成功"
    }
});

router.get('/getInfo', async(ctx, next) => {
    const info = await ServiceInfo.getInfo();
    ctx.body = {
        "result": {proxy_switch: info.status},
        "code": 200,
        "msg": "success"
    }
});

router.post('/setInfo', async(ctx, next) => {
    const requestData = ctx.request.body;
    await ServiceInfo.setInfo(requestData);
    ctx.body = {
        "result": "success",
        "code": 200,
        "msg": "设置成功"
    }
});

export default router
