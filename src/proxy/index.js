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

const getSetInfo = async () => {
    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    const apiMap = _.map(apiSet, (item) => {
        return {
            "url": path.join(proxySet.url, item.name),
            "json": item.json,
            "status": item.status,
            "statusCode": item.statusCode
        }
    });
    const rule = {
        async beforeSendResponse(requestDetail, responseDetail) {
            let newRes = responseDetail.response;
            const urlReg = /(\w+):\/\/(([^\:|\/]+)(\:\d*)?(.*\/)([^#|\?|\n]+))?(#.*)?(\?.*)?/i;
            const formerUrl = urlReg.exec(requestDetail.url)[2];
            _.forEach(apiMap, function (item) {
                if (formerUrl === item.url && item.status) {
                    newRes.header['X-Proxy-By'] = 'YSF-MOCK';
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

export default {
    getSetInfo
}