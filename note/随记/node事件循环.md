最近在学习 nodejs 的事件循环，提到了`process.nextTick()`和`Promise.then`优先级的问题，虽然一般来说前者优先级是高后面的，但执行情况可能会不一样

例如下面这段代码：

```js
Promise.resolve().then(() => console.log("this is Promise.resolve 1"));
process.nextTick(() => console.log("this is process.nextTick 1"));
```

在`CommonJS`模式输出是：

```js
this is process.nextTick 1
this is Promise.resolve 1
```

但在`module`模式输出是：

```js
this is Promise.resolve 1
this is process.nextTick 1
```

这种差异的原因是`nextTick`和`Promise.then`不在同一个队列中，而在 module 模式下，为了可以支持[全局 await](https://github.com/nodejs/node/blob/5e98a7432793c84efe504d551bb46dcfe2c04c09/lib/internal/modules/esm/module_job.js#L192)，已经处于微任务阶段，会先执行先微任务队列。
同样可以使用`Promise.then`来模拟：

```js
function run() {
  Promise.resolve().then(() => console.log("this is Promise.resolve 1"));
  process.nextTick(() => console.log("this is process.nextTick 1"));
}
Promise.resolve().then(run);
```

上面代码无论什么格式下都会输出：

```js
this is Promise.resolve 1
this is process.nextTick 1
```

所以测试 node 的任务队列，最好是放在 I/O 或者 setTimeout 回调中，在实际情况可以使用`setImmediate`代替`process.nextTick`，`setImmediate`能保证执行位于`Promise.then`回调

相关链接：
[博客](https://blog.platformatic.dev/the-nodejs-event-loop?source=personalized-newsletter&source-id=2023-11-23)
[node 文档](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick)
