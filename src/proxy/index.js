/**
 * AnyProxy
 * Created by qingze
 * User: hzqingze(hzqingze@corp.netease.com)
 * Date: 2017/3/23
 * Time: 下午6:28
 **/
import setting from '../models/setting'
import apiList from '../models/apiList'
import _ from 'lodash';
import path from 'path';
import apiEmiiter from './emmiter';
import AnyProxy from 'anyproxy'

const getSetInfo = async () => {
    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    let apiMap = _.map(apiSet, (item) => {
        return {
            "url": path.join(proxySet.url, item.name),
            "json": item.json,
            "status": item.status,
            "statusCode": item.statusCode,
            "id": item._id,
            "name": item.name
        }
    });
    /**
     * Api添加
     */
    apiEmiiter.on('apilistadd', function (result) {
        apiMap.push({
            "url": path.join(proxySet.url, result.name),
            "json": result.json,
            "status": result.status,
            "statusCode": result.statusCode,
            "id": result._id,
            "name": result.name
        });
    });
    /**
     * Api编辑
     */
    apiEmiiter.on('apilistedit', function (result) {
        apiMap = _.forEach(apiMap, function (item) {
            if (item.id == result.id) {
                _.extend(item, {
                    "url": path.join(proxySet.url, result.name),
                    "json": result.json,
                    "status": result.status,
                    "statusCode": result.statusCode,
                    "name": result.name
                });
                return false;
            }
        });
    });
    /**
     * Api删除
     */
    apiEmiiter.on('apilistdel', function (id) {
        apiMap = _.filter(apiMap, function (item) {
            return item.id != id
        });
    });
    /**
     * 拦截url改变
     */
    apiEmiiter.on('urlchange', function (url) {
        apiMap = _.forEach(apiMap, (item) => {
            item.url = path.join(url, item.name)
        });
    });
    const rule = {
        async beforeSendResponse(requestDetail, responseDetail) {
            let newRes = responseDetail.response;
            const urlReg = /(\w+):\/\/(([^\:|\/]+)(\:\d*)?(.*\/)([^#|\?|\n]+))?(#.*)?(\?.*)?/i;
            const formerUrl = urlReg.exec(requestDetail.url)[2];
            _.forEach(apiMap, function (item) {
                if (formerUrl === item.url && item.status) {
                    newRes.header['X-Proxy-By'] = 'YSF-MOCK-RES';
                    newRes.body = JSON.stringify(item.json);
                    newRes.statusCode = item.statusCode || 200;
                    return false;
                }
            });
            return {
                response: newRes
            }
        },
    };
    return {
        port: proxySet.port,
        rule: rule,
        webInterface: {
            enable: true,
            webPort: proxySet.anyproxy_port,
            wsPort: proxySet.ws_port,
        },
        throttle: proxySet.throttle || '',
        forceProxyHttps: proxySet.forceProxyHttps,
        silent: false
    };
};

async function openAnyProxy() {
    const options = await getSetInfo();
    const proxySvr = new AnyProxy.ProxyServer(options);
    proxySvr.on('ready', () => {
        console.log("AnyProxy Server ready")
    });
    proxySvr.start();
}

export default {
    openAnyProxy
}