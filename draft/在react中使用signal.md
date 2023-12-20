最近发现一个 react 的[signal 库](https://github.com/preactjs/signals)，不像其他一些状态库，他在 react 中的使用方式很简单，例如下面这段代码：

```js
import { signal } from "@preact/signals-react";

const count = signal(0);

function CounterValue() {
  return <p onClick={() => count.value++}>Value: {count.value}</p>;
}
```

对 react 稍微熟悉的人应该都知道 react 的状态更新基本离不开 hook 方法，但这里却可以直接通过`count.value++`来更新状态，难道 react 还有其他不为所知方法可以实现状态更新吗？但然不是，不过也使用了一些特殊技巧，在介绍原理前，先简单介绍下 signal，有兴趣也可以直接看[源码](https://github.com/preactjs/signals/blob/main/packages/react/src/index.ts)，代码其实不多。

## signal

signal 并不是一个新概念，可以理解是响应式更新，熟悉 vue 的肯定不会陌生，Qwik 的作者也曾经发文表示[signal 是前端框架的未来](https://www.builder.io/blog/usesignal-is-the-future-of-web-frameworks#code-use-ref-code-does-not-render)，事实上，近些年流行的新框架，无一例外都有响应式更新的概念。
signal 相比传统状态，主要有两个优势

- 更好的开发者体验，无需手动维护 effect 的依赖，无需担心闭包陷阱
- 更好的细粒度更新性能

第一点我相信开发过 react 的基本都能理解，第二点可以通过一段代码了解下

先简单加个一个包装函数，可以类比为 react 的组价，只有用于全局存储运行的函数方便 hook 使用

```js
// 包装函数，用于存储当前运行函数
let curFn = null;
function com(fn) {
  const fnWrap = (...arg) => {
    curFn = fnWrap;
    fn(...arg);
  };
  return fnWrap;
}
```

这里需要先假定了所以函数的入参都是一致的

```js
// 数据存储
const data = { value: "", bindRender: null };
function useState(arg) {
  const setState = (arg) => {
    data.value = arg;
    // 执行绑定的函数
    data.bindRender();
  };
  if (data.value) return [data.value, setState];
  // 绑定函数
  data.bindRender = curFn;
  data.value = arg;
  return [arg, setState];
}

const child1 = com((name) => console.log(`child1: `, name));
const child2 = com(() => console.log(`child2: `));
let timer = null;
const app = com(() => {
  const [name, setName] = useState("hello");
  // 模拟事件更新
  if (!timer) {
    timer = setTimeout(() => setName("world"), 100);
  }
  child1(name);
  child2(name);
});
app();
// 输出结果：
// child1:  hello
// child2:
// child1:  world
// child2:
```

简单实现了一个类似 react 的状态更新，虽然我们在`app`方法中引入了`child1`和`child2`并都传入了参数，但实际上只有`child1`真正使用了这个参数，最理想的情况当然是`name`更新只触发`child1`方法。但在 js 中，像`name`这种基本类型是没法追踪的，这意味框架没办法知道那个组件使用了参数，只能更新所有子组件。

基本类型没办法做到追踪，但函数可以，所以我们可以把`name`参数修改为`getName`函数，在`getName`中进行追踪订阅，当`name`更新时，执行订阅的函数，这样就可以做到只更新使用了参数的组件。

```js
const subscribeSet = new Set();
const data = { value: "" };
function useState(arg) {
  const setState = (arg) => {
    data.value = arg;
    // 执行绑定的函数
    subscribeSet.forEach((fn) => fn(getValue));
  };
  // 获取值时，订阅当前函数
  const getValue = () => {
    subscribeSet.add(curFn);
    return data.value;
  };
  if (data.value) return [getValue, setState];
  data.value = arg;
  return [getValue, setState];
}

const child1 = com((getName) => console.log(`child1: `, getName()));
const child2 = com(() => console.log(`child2: `));
let timer = null;
const app = com(() => {
  const [getName, setName] = useState("hello");
  // 模拟事件更新
  if (!timer) {
    timer = setTimeout(() => setName("world"), 100);
  }
  child1(getName);
  child2(getName);
});
app();
// 输出结果：
// child1:  hello
// child2:
// child1:  world
```

可以看到在更新状态后，`child2`并没有运行，这受益于这几个变化

- 增加了订阅记录`subscribeSet`，`setSate`的更新该为调用所有收的依赖
- 把`name`替换成`getName`，调用`getName`会返回当前值，并且订阅当前函数

如果把`console.log`看做框架的渲染方法，通过简单的依赖收集，我们成功避免了额外的更新渲染。
[solid.js](https://www.solidjs.com/docs/latest/api#createsignal)就采用类似方法，`createSignal`会返回一个获取方法和一个修改方法，另外一些框架也会使用[Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)代理对象来实现类似功能，实际上也是类似的原理。

## react 中使用
