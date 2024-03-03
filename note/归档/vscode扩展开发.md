---
draft: false
createdAt: 2022-08-01T09:17:57.000Z
updatedAt: 2024-03-03T10:25:23.854Z
---

# vscode扩展开发

# 一、基本流程

1. 首先安装脚手架 \*\*\*\*`npm install -g yo generator-code`
2. 然后进入工作目录，使用脚手架 **`yo code`**
3. 在开发时可以直接按F5进行测试
4. 开发完成后安装 `npm install -g vsce`
5. 输入 `vsce package` 进行打包，应该可以在文件夹看到.vsix后缀文件
6. 可以在vscode扩展中选择**从VSIX安装**，选择打包出的文件。也可参考官网进行发布[https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions)

> **参考链接:**
> 官网：[https://code.visualstudio.com/api](https://code.visualstudio.com/api) 非官方翻译：[https://liiked.github.io/VS-Code-Extension-Doc-ZH/#/](https://liiked.github.io/VS-Code-Extension-Doc-ZH/#/)
> 相关博客：[http://blog.haoji.me/vscode-plugin-overview.html](http://blog.haoji.me/vscode-plugin-overview.html)

# 二、开发一个右键运行当前模块的插件

## 目标

在项目的多模块开发中，每次切换模块都需要先关闭当前进程，然后切换到目标模块路径，最后再执行start命令，比较繁琐。这个插件的目标就是简化这个流程，在打开当前模块的任意文件后，能直接右键运行start命令，自动关闭之前进程并跳转到当前模块下。

## 实现

1.  在脚手架创建项目时项目名rightClick，语言选择js，这里是为了方便，但一般更推荐ts，因为选js是默认不支持es module，很多包不支持require。
2.  打开package.json，找到contributes，这是注册事件的地方，注册下右键菜单。
    修改完进行调试，打开一个文件然后右键应该可以看到`运行当前模块` 这个菜单
        ```jsx
        "contributes": {
            "commands": [
              {
                "command": "rightclick.helloWorld",
                "title": "运行当前模块"
              }
            ],
            "menus": {
              "explorer/context": [
                {
                  "command": "rightclick.helloWorld",
                  "group": "4_modification"
                }
              ],
              "editor/context": [
                {
                  "command": "rightclick.helloWorld",
                  "group": "4_modification"
                }
              ]
            }
          },
        ```

        这部分具体可以查看[https://code.visualstudio.com/api/references/contribution-points](https://code.visualstudio.com/api/references/contribution-points)
3.  打开extension.js文件，有个activate方法，改写为

    ```jsx
    let runTml;       // 记录终端
    let preFullPath;  // 记录当前打开终端路径，减少重复执行
    function activate(context) {
    	let disposable = vscode.commands.registerCommand('rightclick.helloWorld', function (uri) {
    		// 找到当前项目根目录
    		const workspaceFolderPath = vscode.workspace.workspaceFolders.find(({ uri: folderUri }) => {
    			return uri.fsPath.startsWith(folderUri.fsPath)
    		}).uri.fsPath;
    		// 当前文件路径
    		let pathList = uri.fsPath.split('\\');
    		const workspaceFolderLength = workspaceFolderPath.split('\\').length;
    		// 如果找到packages文件，取下一级目录，查询到项目根目录停止
    		for (let i = pathList.length - 2; i >= workspaceFolderLength; i--) {
    			if (pathList[i] === 'packages') {
    				pathList = pathList.slice(0, i + 2);
    				break;
    			}
    		}
    		// 这里分成两个路径，保证至少一个是目录，如果最后是文件也保证会定位它目录上
    		const resPathPre = pathList.slice(0, -1).join('\\');
    		const resPathTail = pathList.slice(-1).join('\\');
    		const fullPath = resPathPre + '\\' + resPathTail
    		// 相同目录不进行处理
    		if (preFullPath !== fullPath) {
    			preFullPath = fullPath;
    			// 这个方法会关闭当前端口，会处理相关进程，关闭之前任务
    			runTml?.dispose();
    			// 重新打开一个终端，命名为run
    			runTml = vscode.window.createTerminal('run');
    			// 执行终端命令
    			runTml.sendText(`cd ${resPathPre}`);
    			runTml.sendText(`cd ${resPathTail}`);
    			runTml.sendText(`yarn start`);
    		}
    	});

    	// 处理手动关闭终端的情况
    	vscode.window.onDidCloseTerminal((terminal) => {
    		if (terminal.name === "run") {
    			runTml = undefined;
    			preFullPath = undefined;
    		}
    	});
    ```

4.  使用`vsce package`打包然后安装，选择一个文件然后右选中`运行当前模块` ，打开终端选项可以看到一个名字为run的终端
