---
draft: false
description: 以 alfred5 为例，实现一个能在 iterm2 运行指定命令的工作流，这里实现一个 git 控制的工作流
createdAt: 2023-06-28T09:17:57.000Z
updatedAt: 2024-03-03T10:06:33.563Z
---

# alfred 工作流脚本

# 目标

以 alfred5 为例，实现一个能在 iterm2 运行指定命令的工作流，这里实现一个 git 控制的工作流。根据个人习惯，这里使用 js+python 实现

# 使用 alfy

[alfy](https://github.com/sindresorhus/alfy)是基于 node 开发，可以更简单获取输入输出和获取 node 环境变量。

# 创建 Script Filter

1. 创建一个新 workflow，起名为 test，`Bundle Id` 必须设置

![Untitled](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled.1hw8zyozrtmo.webp)

1. 新建 Script Filter，右键→ Inputs → Script Filter，设置**Keyword**为`test`，设置 with space 可选，设置**Language**为`/bin/bash` ，添加脚本`./node_modules/.bin/run-node index.js "$1"`

![Untitled-1](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-1.3pnd0zfh2qw0.webp)

保存后打开 alfred 输入 test 就可以看到新加命令了。

![Untitled-2](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-2.3ge9ajz9sii0.webp)

1. 右键进入命令行，输入 pnpm init，也可以选择 npm 或者 yarn

![Untitled-3](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-3.l5fstyikl34.webp)

1. 打开 package.json，添加"type": "module"。
2. 安装 alfy 包，`pnpm add alfy`
3. 打开 index.js，实现一个 git 推送拉取的选项

   ```jsx
   import alfy from "alfy";

   const inputs = alfy.input.split(" ");
   const data = [
     {
       id: "1",
       title: "pull",
       body: "拉取代码",
       arg: ["git pull"],
     },
     {
       id: "2",
       title: "push",
       body: "推送代码，备注：" + (inputs[1] || ""),
       arg: ["git add .", `git commit -m ${inputs[1] || ""}`, "git push"],
     },
   ];

   const items = alfy.matches(inputs[0], data, "title").map((element) => ({
     title: element.title,
     subtitle: element.body,
     arg: element.arg,
   }));

   alfy.output(items);
   ```

上面代码取第一个输入作为筛选，第二输入作为提交备注，ouput 的参数可以参考[alfred 文档](https://www.alfredapp.com/help/workflows/inputs/script-filter/json/)。

![Untitled-4](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-4.54ihw209yt80.webp)

# 打开 iterm2

为保证 iterm2 打开，增加一个 actions 在执行完筛选后打开 iterm2

![Untitled-5](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-5.66hv73aktj00.webp)

# 控制 iterm2

iterm2 可以通过 Python 脚本进行控制，具体可以参考[官方介绍](https://iterm2.com/python-api/tutorial/index.html#tutorial-index)。

## 增加**actions**

增加一个**Run Script**的**actions**

![Untitled-6](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-6.6svavkineoc0.webp)

参数这样设置就可以

![Untitled-7](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/picx-images-hosting@master/20231220/Untitled-7.5bn3e0qgpf80.webp)

# 添加脚本

打开文件，增加**test.py**文件

```python
#!/usr/bin/env python3
import iterm2
import sys

async def runCommand(session: iterm2.Session, command: str):
    return await session.async_send_text(command + '\n')

async def main(connection):
    app = await iterm2.async_get_app(connection)
    window = app.current_terminal_window
    if not window:
        window = await iterm2.Window.async_create(connection)
    else:
        # 查找标题为 run 的 tab，如果没有则创建一个，避免打开太多 tab
        current_tab = None
        for tab in window.tabs:
            name = await tab.async_get_variable("titleOverride")
            if name == "run":
                current_tab = tab
                break
        if not current_tab:
            await window.async_create_tab()
            await window.async_activate()
            await window.current_tab.async_set_title("run")
            current_tab = window.current_tab
    session = current_tab.current_session
    # 运行参数命令
    for command in sys.argv[1:]:
        await runCommand(session, command)
    # 添加完成提示
    display = 'display notification "运行完成" with title "标题"'
    await runCommand(session, "osascript -e '"+display+"'")
		# 如果安装了 terminal-notifier，可以点击提示聚焦到 iterm2
		# https://github.com/julienXX/terminal-notifier
		# runCommand(session, 'terminal-notifier -title "标题" -message "运行完成" -activate com.googlecode.iterm2')
    # await window.current_tab.async_close()

iterm2.run_until_complete(main)
```

需要先安装`iterm2`包，运行`pip3 install iterm2` 或者`pip install iterm2` 。

上面代码打开了一个名字为 run 的 tab，并将传入的参数作为命令输入，最后会通过 osascript 弹出完成提示，这个对长时间的任务很有用。
