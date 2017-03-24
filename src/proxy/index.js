/**
 * AnyProxy
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午6:28
 **/
import AnyProxy from 'anyproxy'
import mongoose from '../models/connect'

const options={
    port: 8001,
    // rule: require('myRuleModule'),
    webInterface: {
        enable: true,
        webPort: 8002,
        wsPort: 8003,
    },
    throttle: 10000,
    forceProxyHttps: false,
    silent: false
}