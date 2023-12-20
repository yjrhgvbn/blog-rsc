# 微信小程序ci打包上传

1、命令行：[https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html#自动预览](https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html#%E8%87%AA%E5%8A%A8%E9%A2%84%E8%A7%88)

例子：[https://www.notion.so/7e99d8276586479c83cb0aee27b8ed90](https://www.notion.so/7e99d8276586479c83cb0aee27b8ed90?pvs=21)

2、ci：[https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)

 

```bash
const ci = require("miniprogram-ci");
const config = require("./config.json"); // 发布的版本信息
const manifest = require("../src/manifest.json"); // 微信小程序的基本信息
let { wxVersion: version, wxDesc: desc } = config;
const appid = manifest["mp-weixin"].appid;
const cwd = process.cwd() + "/dist/build/mp-weixin";
if (!version) version = "v1.0.0";
if (!desc) desc = new Date() + "上传";
const project = new ci.Project({
  appid: appid,
  type: "miniProgram",
  projectPath: cwd,
  privateKeyPath: process.cwd() + "/src/wxUpload/private." + appid + ".key", // 秘钥
  ignores: ["../node_modules/**/*"],
});
ci.upload({
  project,
  version,
  desc,
  setting: {
    minify: true,
  },
})
  .then((res) => {
    console.log(res);
    console.log("上传成功");
  })
  .catch((error) => {
    if (error.errCode == -1) {
      console.log("上传成功");
    }
    console.log(error);
    console.log("上传失败");
    process.exit(-1);
  });
```