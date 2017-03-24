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

const getSetInfo = async() => {
    const proxySet = await setting.getProxy();
    const apiSet = await apiList.getApiList();
    const apiMap = _.map(apiSet, (item) => {
        return item.name;
    });
    const rule = {
        // *beforeSendRequest(requestDetail) {
        //     if (requestDetail.url.indexOf('http://httpbin.org') === 0) {
        //         const newRequestOptions = requestDetail.requestOptions;
        //         newRequestOptions.path = '/user-agent';
        //         newRequestOptions.method = 'GET';
        //         return {
        //             requestOptions: newRequestOptions
        //         };
        //     }
        // },
    };
    return {
        port: proxySet.port,
        rule: rule,
        webInterface: {
            enable: true,
            webPort: proxySet.anyproxy_port,
            wsPort: 8003,
        },
        throttle: proxySet.throttle || '',
        forceProxyHttps: proxySet.forceProxyHttps,
        silent: false
    };
};

export default {
    getSetInfo
}