webpackJsonp([7],{274:function(e,r,t){var l=t(165)(t(390),t(374),null,null);e.exports=l.exports},374:function(e,r){e.exports={render:function(){var e=this,r=e.$createElement,t=e._self._c||r;return t("div",{staticClass:"main_content_wrapper",staticStyle:{padding:"20px"}},[t("div",{staticClass:"main_content"},[t("div",{staticClass:"proxy_form"},[t("el-form",{ref:"proxy_form",attrs:{model:e.proxy_form,rules:e.rules,"label-width":"200px"}},[t("el-form-item",{attrs:{label:"代理端口:",prop:"port"}},[e._v("\n          "+e._s(e.proxy_form.port)+"\n        ")]),e._v(" "),t("el-form-item",{attrs:{label:"拦截url:",prop:"url"}},[t("el-input",{model:{value:e.proxy_form.url,callback:function(r){e.proxy_form.url=r},expression:"proxy_form.url"}})],1),e._v(" "),t("el-form-item",{attrs:{label:"限速(kb/s)"}},[t("el-select",{attrs:{placeholder:"No throttling"},model:{value:e.proxy_form.throttle,callback:function(r){e.proxy_form.throttle=r},expression:"proxy_form.throttle"}},e._l(e.throttleOptions,function(e){return t("el-option",{attrs:{label:e.label,value:e.value}})}))],1),e._v(" "),t("el-form-item",[t("el-button",{attrs:{type:"primary",disabled:e.loading},on:{click:function(r){e.submitForm("proxy_form")}}},[e._v("保存")])],1)],1)],1)])])},staticRenderFns:[]}},390:function(e,r,t){"use strict";Object.defineProperty(r,"__esModule",{value:!0});var l=t(166);r.default={data:function(){return{loading:!1,edit:!1,throttleOptions:[{label:"No throttling",value:0},{label:"Very Slow(5kb/s)",value:5},{label:"GPRS(50kb/s)",value:50},{label:"Regular 2G(250kb/s)",value:250},{label:"Good 2G(450kb/s)",value:450},{label:"Regular 3G(750kb/s)",value:750},{label:"Good 3G(1.5Mb/s)",value:1536},{label:"Regular 4G(4Mb/s)",value:4096},{label:"DSL(2Mb/s)",value:2048},{label:"WiFi(30Mb/s)",value:30720}],proxy_form:{url:"",ws_port:null,port:null,anyproxy_port:null,throttle:null,forceProxyHttps:!1},rules:{url:[{type:"string",required:!0,message:"请输入需要代理的url",trigger:"blur"}],port:[{type:"number",required:!0,message:"请输入正确的代理目标端口",trigger:"blur"}],ws_port:[{type:"number",required:!0,message:"请输入正确的代理目标端口",trigger:"blur"}],anyproxy_port:[{type:"number",required:!0,message:"请输入正确的AnyProxy目标端口",trigger:"blur"}]}}},methods:{submitForm:function(e){var r=this;this.$refs[e].validate(function(e){e&&(r.loading=!0,t.i(l.m)(r.proxy_form).then(function(e){r.loading=!1;var t=e.data;r.$message({showClose:!0,message:t.msg,type:200===t.code?"success":"error"})}))})}},mounted:function(){var e=this;t.i(l.n)().then(function(r){var t=r.data;200===t.code&&_.assign(e.$data.proxy_form,t.result)})}}}});
//# sourceMappingURL=7.427e69050e216bbc7793.js.map