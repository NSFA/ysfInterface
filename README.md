[开发模式] 开发模式下，文件修改后~~自动重启 Node.js~~ 自动热重启服务。       

[线上模式] pm2 

## Npm scripts

```bash
$ npm start # 开发模式, 开启开发模式之后对于 /src 目录内的任何改动会自动热替换生效
$ npm run build # build
$ npm test # 单元测试
$ npm run compile # 编译
$ npm run production # 生产模式
```

## 线上部署

```bash
npm run build # 单测, 编译 ES6/7 代码至 ES5
vim pm2.json # 检查 pm2 的配置
pm2 start pm2.json # 请确保已经 global 安装 pm2    (npm i pm2-cli -g)
cp nginx.conf /etc/nginx/conf.d/YourProject.conf # 自行配置 nginx 反代
```

## 配置文件的 trick

引用配置的方式: 

```javascript
import config from './config'
```

默认配置文件位于 `src/config/default.js`, 建议只在这里创建配置字段, 在同目录下创建另一个 `custom.js`, 这个配置会覆盖(override) 默认配置.
