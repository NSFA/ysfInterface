import http from 'http'
import path from 'path'

import Koa from 'koa'
import views from 'koa-views'
import convert from 'koa-convert'
import json from 'koa-json'
import Bodyparser from 'koa-bodyparser'
import logger from 'koa-logger'
import koaStatic from 'koa-static-plus'
import koaOnError from 'koa-onerror'

import color from 'colorful'

import config from './config'
import proxy from './proxy'

import logUtil from '../proxy/lib/log'

const app = new Koa();

const bodyparser = Bodyparser();

// middlewares
app.use(convert(bodyparser));
app.use(convert(json()));
app.use(convert(logger()));

// static
app.use(convert(koaStatic(path.join(__dirname, '../public'), {
    pathPrefix: ''
})));

// views
app.use(views(path.join(__dirname, '../views'), {
    extension: 'ejs'
}));

// 500 error
koaOnError(app, {
    template: 'views/500.ejs'
});

// logger
app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    logUtil.printLog(`${ctx.method} ${ctx.url} - ${ms}ms`)
});

// response router
app.use(async (ctx, next) => {
    await require('./routes').routes()(ctx, next)
});

// 404
app.use(async (ctx) => {
    ctx.status = 404;
    await ctx.render('404')
});

// error logger
app.on('error', async (err, ctx) => {
    logUtil.printLog('error occured:', logUtil.T_ERR)
});

//listen
const port = parseInt(config.port || '3000');
const server = http.createServer(app.callback());

server.listen(port);

server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error
    }
    switch (error.code) {
        case 'EACCES':
            logUtil.printLog(port + ' requires elevated privileges',logUtil.T_ERR);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logUtil.printLog(port + ' is already in use',logUtil.T_ERR);
            process.exit(1);
            break;
        default:
            throw error
    }
});

server.on('listening', () => {
    logUtil.printLog('Listening on port: %d', port)
});

//open proxy
proxy.openProxy().then(()=>{
    logUtil.printLog(color.yellow(`proxyServer all started at ${config.port} - ${new Date()}`))
});

export default app
