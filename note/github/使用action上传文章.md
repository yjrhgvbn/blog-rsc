---
draft: false
createdAt: 2022-08-01T09:17:57.000Z
updatedAt: 2024-03-03T10:30:55.831Z
---

写博客文章时，有几个费事的点

1. 备份：无论是本地写完备份再上传，还是直接在平台上写然后导出备份，每次都要操作多次，同样更新也需要多次操作，还可能重新两份数据不同步的情况。

2. 写引言：在文章列表一般都需要一个引言，但估计一般人不太愿意写，当然我也是一样。

想解决上面的问题，需要上传能自动重复备份，或者备份时自动触发上传，这里很难不联系到CI\CD。我们完全可以使用同样的思路，通过[GitHub Action](https://github.com/features/actions)来处理。使用github作为文章备份服务，每次提交时上传。至于引言，可以在action中通过AI生成。

## 创建备份仓库

这里使用node作为上传服务

在目录创建`upload.js`文件，假设已经存在一个`publicServe`的方法上传文章

## 获取修改文件

通过`git diff`可以判断哪些文章有修改。要注意如果文章名包含中文，需要设置`git config --global core.quotepath false`，防止出现中文连码的情况。

```javascript
import { execSync } from "child_process";

/**
 * 获取两个 Git 提交之间的文件差异
 * @param {string} latestCommitSha - 最新的 Git 提交 SHA
 * @param {string} prevCommitSha - 上一个 Git 提交 SHA
 * @return {{ oldFilePath: string; newFilePath: string }[]} - 返回一个对象，包含 status, oldFilePath, newFilePath
 */
function getDiffFiles(latestCommitSha, prevCommitSha) {
  let diffOutput;
  if (!prevCommitSha || !latestCommitSha) {
    diffOutput = execSync(`git diff --name-status HEAD^ HEAD`).toString();
  } else {
    diffOutput = execSync(`git diff --name-status ${prevCommitSha} ${latestCommitSha}`).toString();
  }
  const diffArray = diffOutput.split("\n");
  // 根据文件状态将文件分组
  return diffArray
    .map((line) => {
      const [_, status, oldFilePath, newFilePath] = line.match(/(?:^([AMDR])\d*\s+([^\s]*)\s*([^\s]*)$)/) || [];
      return status && oldFilePath ? { status, oldFilePath, newFilePath: newFilePath || oldFilePath || "" } : null;
    })
    .filter((item) => item && item.newFilePath.toLocaleLowerCase().endsWith(".md"))
    .reduce((acc, { oldFilePath, newFilePath }) => {
      acc.push({ oldFilePath, newFilePath });
      return acc;
    }, []);
}
```

这里并没有返回文件状态（修改，新增等），因为目前没有不考虑删除的情况，考虑到上传失败的情况，这些状态并没有太多的参考价值。

## 生成文章开篇

这里使用chatgpt生成开篇，使用[chatgpt](https://www.npmjs.com/package/chatgpt)包，chatgpt的apiKey通常保存在[github secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)中，通过环境变量或者参数传递进来。考虑到gpt服务可能不稳定，一般需要多试几遍。

```javascript
import { ChatGPTAPI } from "chatgpt";

const apiKey = process.env.API_KEY;
async function generateArticleIntro(content) {
  for (let i = 1; i < 3; i++) {
    try {
      const api = new ChatGPTAPI({
        apiKey,
      });
      const res = await api.sendMessage(`给下面的文章添加一个简要的开篇\n ${content}`);
      if (res.text) {
        return res.text;
      }
    } catch (e) {
      if (i < 3) console.log("重试第" + i + "次");
      else throw e;
    }
  }
  return "";
}
```

## 获取之前执行失败的文件

生成开篇或者上传都可能存在失败的情况，需要我们记录下来，读取并添加到本次的流程中。

```javascript
/**
 * 获取修改文件并与上传失败记录合并
 * @param {string} latestCommitSha - 最新的 Git 提交 SHA
 * @param {string} prevCommitSha - 上一个 Git 提交 SHA
 * @param {{ [oldFilePath: string]: { oldFilePath: string; newFilePath: string } }} preFailRecord - 上传失败记录
 * @return {{ oldFilePath: string; newFilePath: string }[]} - 返回一个对象，包含 status, oldFilePath, newFilePath
 */
function ensureDiffFiles(latestCommitSha, prevCommitSha, preFailRecord) {
  const diffFiles = getDiffFiles(latestCommitSha, prevCommitSha);
  for (const [failFilename, file] of Object.entries(preFailRecord)) {
    if (diffFiles.some((item) => item.newFilePath === file.newFilePath && item.oldFilePath === file.oldFilePath)) {
      continue;
      // 当前旧文件名和记录旧文件名相同，说明文件二次重名名，删除旧的失败记录
    } else if (diffFiles.some((item) => item.oldFilePath === file.oldFilePath)) {
      delete preFailRecord[failFilename];
      continue;
      // 当前新文件名和记录旧文件名相同，说明文件在失败基础上修改，旧文件名改为失败记录的
    } else if (diffFiles.some((item) => item.oldFilePath === file.newFilePath)) {
      const index = diffFiles.findIndex((item) => item.oldFilePath === file.newFilePath);
      diffFiles[index].oldFilePath = file.oldFilePath;
      delete preFailRecord[failFilename];
      continue;
    } else {
      diffFiles.push(file);
    }
  }
  return diffFiles;
}
```

preFailRecord是记录上次执行失败的文件。这里需要考虑文件重命名的情况，删除等更复杂的情况暂时没有处理。

## 保存记录

在这里有三类数据需要额外记录

1. 上次触发action的sha，因为操作提交多次然后才上传的情况，不可能直接取上一次提交sha。

2. 失败记录，就是前面preFailRecord参数，因为不保证上传能一次性成功，需要加入后续action中重新执行

3. 文件对应的上传数据，例如上传完成后返回的文件id，用于更新或者判断是否需要生成开篇。

后面的问题是在哪里保存这些数据

1. 在本仓库下保存，好处是容易读取和修改，缺点是提交记录会很难看

2. 通过action缓存记录，缺点不易于本地测试，读取和修改也比较麻烦

3. 通过服务器缓存，缺点是比较繁琐，需要额外的维护

4. 子模块，这个无疑是最合适的方案，随时修改和读取，也可以免费托管到github上，也不会影响主仓库git提交记录

git子模块可以参考这个[文档]((https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E5%AD%90%E6%A8%A1%E5%9D%97)

首先在github创建一个缓存仓库，这里起名cache

然后添加到仓库下

```shell
git submodule add https://github.com/user/cache
```

会看到一个cache目录，然后在主模块目录下推送上去就好了。

这里需要在子模块（cache目录下）创建3个文件， `sha.json`   `recordFail.json` `record.json` ，对应上面三类数据，初始值写入`{}`就可以。

然后在cache目录下执行`git push`就可以更新子模块了

## 整合

根据上传结果更新json文件就可以

```javascript
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const prevCommitSha = readJsonFile("./cache/sha.json")?.sha;
  const latestCommitSha = process.env.GITHUB_SHA;
  const fileRecord = readJsonFile("./cache/record.json");
  const preFailRecord = readJsonFile("./cache/recordFail.json");
  const diffFiles = ensureDiffFiles(latestCommitSha, prevCommitSha, preFailRecord);
  for (const file of diffFiles) {
    const { oldFilePath, newFilePath } = file;
    const toSaveDate = {
      title: getFileName(newFilePath),
      content: readFileSync(newFilePath, "utf-8"),
    };
    // 是否未记录，未记录则生成开篇
    try {
      if (!fileRecord[oldFilePath]) {
        const overview = await generateArticleIntro(toSaveDate.content);
        toSaveDate.overview = overview;
      } else {
        toSaveDate.id = fileRecord[oldFilePath];
      }
      const id = await publicServe(toSaveDate);
      if (id) {
        // 处理重命名
        if (oldFilePath !== newFilePath) delete fileRecord[oldFilePath];
        fileRecord[newFilePath] = id;
        delete preFailRecord[newFilePath];
      } else {
        preFailRecord[newFilePath] = file;
      }
    } catch (e) {
      preFailRecord[newFilePath] = file;
      console.log(e);
    }
  }
  saveJsonFile("./cache/sha.json", { sha: latestCommitSha });
  saveJsonFile("./cache/record.json", fileRecord);
  saveJsonFile("./cache/recordFail.json", preFailRecord);
}

function getFileName(path) {
  return path.split("/").pop().split(".")[0];
}
// 读取json文件
function readJsonFile(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}
// 保存json文件
function saveJsonFile(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}
```

## 增加action

创建文件`.github/workflows/upload.yml`

```yml
name: Upload

on:
  push:
    branches: [main]

permissions: write-all

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: checkout
        uses: actions/checkout@v3
        with:
          submodules: recursive
          token: ${{ secrets.TOKEN }}
          fetch-depth: 0

      - uses: pnpm/action-setup@v2
        with:
          version: 6.0.2

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "pnpm"

      - name: update submodule
        run: git submodule update --recursive --remote

      - name: run upload
        run: |
          git config --global core.quotepath false
          pnpm install
          node upload.js
        env:
          API_KEY: ${{ secrets.API_KEY }}

      - name: commit changes
        run: |
          git config --global user.name "yjrhgvbn"
          git config --global user.email "yjrhgvbn@gmail.com"
          cd cache
          git commit -a -m "Add record"

      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.TOKEN }}
          directory: "./cache"
          repository: "yjrhgvbn/cache"
          force: true
```

action这里不多结束，只有有几个注意的地方

1. `permissions: write-all`需要增加写入权限，不然无法更新文件

2. `fetch-depth: 0`，默认情况下[actions/checkout@v3](https://github.com/actions/checkout)只会拉取最后一次提交，这里需要拉取之前的提交进行diff

3. `git submodule update --recursive --remote`，拉取最新的子模块

4. `git config --global core.quotepath false`，防止diff时中文乱码

## 最后

完整项目可以查看[项目](https://github.com/yjrhgvbn/blog-notes)。
