---
draft: false
createdAt: 2022-08-01T09:17:57.000Z
updatedAt: 2024-03-03T10:25:17.887Z
---

# Git 技巧

## 一、Git 别名

git 命令通常有很多参数，想记住这些参数不仅困难也没必要，而使用 Git 别名能让你体验更简单。

```
$ git config --global alias.amit 'commit --amend --no-edit'
$ git amit
```

当然你也可以到 git 安装目录下的.gitconfig 文件下进行修改。如果你已经定义了一个别名，应该可以在\[alias]下看到对应信息。

git 别名更重要一点是当以感叹号 (!) 作为前缀，它将被视为 shell 命令，你可以依靠这点实现组合命令。例如将暂存 (add) 和提交 (commit) 组合成一条命令：

```
$ git config --global alias.ac '!git add . && git commit'
$ git ac
```

## 二、提交信息写错了

如果你的提交信息 (commit message) 写错了且这次提交 (commit) 还没有推 (push), 你可以通过下面的方法来修改提交信息 (commit message):

```
$ git commit --amend --only
```

这会打开你的默认编辑器，在这里你可以编辑信息。另一方面，你也可以用一条命令一次完成：

```
$ git commit --amend --only -m 'xxxxxxx'
```

当然你也可以不修改提交信息，这个正是别名中的例子：

```
$ git commit --amend --no-edit
```

如果你已经推 (push) 了这次提交 (commit), 你可以修改这次提交 (commit) 然后强推 (force push), 但是不推荐这么做，除非你确保其他人没依赖这次提交。

## 三、删除任意提交内容

有可能在某次提交过程中你上传了本应该存在于 Local 的文件内容，比如账号密码等，这个时候你想删除这次 commit 的记录。

```
$ git rebase --onto [SHA]^ [SHA]
$ git push -f [remote] [branch]
```

## 四、找回 reset 操作的内容

我经常使用回退功能，因为我开发时会经常进行提交，而在推送前回退到最初的版本，借助编辑器重新确认下修改点并重新提交，类似于变基操作。但也有不小心出现工作区和暂存区都为空的情况，幸好 Git 对每件事都会有日志，且都会保存几天。

```
$ git reflog
```

会看到你过去的操作，和一个重置的提交 (HEAD@{0})。选择你想要回到的提交 (commit) 的 SHA(一般是第二有 SHA 的日志)，再重置一次：

```
$ git reset --hard [SHA]
```

但最好的做法还是回退前记录下 SHA，因为 git 日志可能会很长。你可以使用别名在每次回退前都输出当前 SHA

```
$ git config --global alias.r '!git rev-parse HEAD && git reset'
$ git r --hard [SHA]
```
