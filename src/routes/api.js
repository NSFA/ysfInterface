import Router from 'koa-router'

const router = new Router()

router.post('/login', function (ctx, next) {
    ctx.body = {
        "result": "success",
        "code": 200,
        "msg": "success"
    }
})

router.get('/getProxy', function (ctx, next) {
    ctx.body = {
        "result": {
            port: 8001,
            anyproxy_port: 8002,
            forceProxyHttps: false,
            throttle: ''
        },
        "code": 200,
        "msg": "success"
    }
})

export default router
