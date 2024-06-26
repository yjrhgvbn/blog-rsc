---
description: 事情要从一次 input 标签的光标问题说起，在异步更新 state 会导致 input 的光标自动移到最后，研究源码后才发现里面比我想象的多。
tags:
  - react
createdAt: 2024-02-01T09:12:57.000Z
draft: false
updatedAt: 2024-03-24T11:01:58.730Z
---

之前碰到一个 react 光标的问题，类似的复现如下

```jsx
function App() {
  const [text, setText] = useState("");
  function updateText(e) {
    const value = e.target.value;
    setTimeout(() => setText(value));
  }
  return <input value={text} onChange={updateText} />;
}
```

这段代码虽然看上去没什么问题，只是对状态的修改做了一个下延迟，但实际操作做后会发现光标会自动后移，而且没办法使用中文输入法了。

就像下面这样，先正常输入`134`，把光标移到中间，然后再输入`2`，光标就会自动移到最后，正常情况下应该是 2 后面。
![image](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/react/image_wd.webp)

这个问题在 react 的[issue](https://github.com/facebook/react/issues/955)里也有人提过，不过没有我想要的答案，所以还是自己看下这个问题是怎么产生的。

# 光标重置的原因

在具体介绍前，得了解什么情况下会导致光标重置，其实很简单，当你通过 js 直接设置`input`的`value`时，光标就会重置，比如`document.querySelector('input').value = '1234'`，就算要设置 value 和当前 value 值相同，同样会重置光标。

# react 的 input 更新

先用同步更新的方式了解 react 怎么更新 input 元素的。用下面这段代码为例。

```jsx
function App() {
  const [text, setText] = useState("");
  function updateText(e) {
    const value = e.target.value;
    setText(value);
  }
  return <input value={text} onChange={updateText} />;
}
```

这里不介绍 react 前面的流程了，直接到 commit 阶段查看，想了解前面流程的可以可以参考[图解 react](https://7km.top/)。

找到`commitMutationEffectsOnFiber`这个方法，这里是 commit 阶段更新 dom 的入口。

为了查看具体流程，我们需要打个断点调试。

```js
function commitMutationEffectsOnFiber() {
  // 省略
  switch (finishedWork.tag) {
    // 省略
    case HostComponent: {
      // 省略
      if (flags & Update) {
        // 这里打个断点查看
        debugger;
        // 省略
      }
    }
  }
}
```

这里打断点是因为 input 在 react 中属于`HostComponent`，可以直接看这个 case，并且我们只关心 input 标签的更新，所以断点位置直接设置在`if (flags & Update)`这个条件下。

准备完成后我们在页面输入`a`，然后就走到了我们断点的位置。下面的代码都会进行简化，取到不需要更新的代码。

```js
if (flags & Update) {
  const instance = finishedWork.stateNode;
  // {value: 'a', onChange: ƒ}
  const newProps = finishedWork.memoizedProps;
  // {value: '', onChange: ƒ}
  const oldProps = current.memoizedProps;
  commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
}
```

这里获取`Props`，newProps 的 value 是`a`，oldProps 的 value 是`''`，和我们更新的状态一样，继续看`commitUpdate`这个方法。

```js
function commitUpdate() {
  // 更新 dom
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  // 更新 Fiber，后面会用到
  updateFiberProps(domElement, newProps);
}
```

这里主要是更新 dom 和更新 Fiber，我们现在只需要看更新 dom 的方法

```js
function updateProperties(domElement, updatePayload, tag, lastRawProps, nextRawProps) {
  switch (tag) {
    case "input":
      ReactDOMInputUpdateWrapper(domElement, nextRawProps);
      break;
    case "textarea":
    // ...
    case "select":
    // ...
  }
}
```

可以看到 react 对于几个表单组件都是做了特殊处理的，继续往下看

```js
// ReactDOMInputUpdateWrapper 就是这个方法，上面引入时设置了别名
function updateWrapper(element, props) {
  // node 是 inupt 元素
  const node = element;
  // value === 'a'   node.value === 'a'
  const value = getToStringValue(props.value);
  const type = props.type;
  if (value != null) {
    if (type === "number") {
      // 省略
    } else if (node.value !== toString(value)) {
      node.value = toString(value);
    }
  }
}
```

此时我们`node.value`和`value`都是`a`，并不会走到任何条件下，也并没有设置 value，所以我们 input 标签的光标不会受到影响。

到这里，其实还是没法解释，因为就算异步更新，`node.value`是 input 的输入，`value`也是根据 input 输入回调设置的值，两者按道理应该是一样的。为什么会出现光标重置的问题呢？我们把代码改成异步更新的方式重新看下。

```jsx
function App() {
  const [text, setText] = useState("");
  function updateText(e) {
    const value = e.target.value;
    setTimeout(() => setText(value));
  }
  return <input value={text} onChange={updateText} />;
}
```

同样输入`a`调试一下，调试一直走到`updateWrapper`这里，发现`node.value`为`''`，但`value`为`a`。`node`是页面的`input`元素，回去看下页面，果然`input`元素也是清空了的。所以这里会`node.value = toString(value)`，会导致光标重置。

不过这里又有了新问题：为什么`node.value`是`''`。我们知道`input`的 value 是我们输入的值，如果没有 js 设置 value，这里应该是`a`才对，而这里成为了`''`，肯定是 react 在这之前做了什么操作，那又是什么时候进行操作的呢？

# react 的数据同步

## 验证

我们在推测 react 可能在 commit 阶段外对 input 标签做了处理，先简单验证

```jsx
function App() {
  const [text, setText] = useState("");
  function updateText() {}
  return <input value={text} onChange={updateText} />;
}
```

这里我们隐藏了`updateText`里面的逻辑，结果发现无论怎么输入，`input`的值空的，说明 react 确实会对 input 做了处理。

## dom 状态重置

这里可以在 updateText 方法打断点然后一点点看在哪里进行了 input 的修改。不过我在调试的时候发现 react 在`trackValueOnNode`方法内对`input.value`做了层代理，所以可以直接加上断点。

![image](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/react/image_pE.webp)

这里增加在 set 方法这里打断点，可以看到调用栈。

![image](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/react/image_co.webp)

`dispatchDiscreteEvent`这里就是 react 的合成事件，说明 react 在 dom 事件触发时是会更新一次 input 的值。

调用栈这里的`updateWrapper`是我们上面介绍过的方法，所以我们只需要关心下`props`参数值哪里取的，往上一直找到`restoreStateOfTarget`

```js
// target 是 input 元素
function restoreStateOfTarget(target) {
  // dom 对应的 fiber
  const internalInstance = getInstanceFromNode(target);
  // stateNode 是 dom 元素，因为没有感谢，所以还是当前的 input 元素
  const stateNode = internalInstance.stateNode;
  if (stateNode) {
    // 获取图下的__reactProps$n2pjsknr78s
    const props = getFiberCurrentPropsFromNode(stateNode);
    // 这个方法最后会调用到 updateWrapper
    restoreImpl(internalInstance.stateNode, internalInstance.type, props);
  }
}
```

![image](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/react/image_fs.webp)
这里`props`会赋值图上的`__reactProps$n2pjsknr78s`('reactProps'+随机数，后面称为`__reactProps$`)。而`__reactProps$`的更新是在`updateFiberProps`方法中，上面`commitUpdate`方法中可以看到，也就是说需要进入 commit 才会更新`__reactProps$`。

## 流程分析

总结下上面的流程

### 同步更新

1. 输入 a，事件触发，调用`setText('a')`，此时`__reactProps$.value === ''`，`input.value === 'a'`
2. 进入 commit 阶段，因为`props.value === input.value`，不会设置`input.value`，然后更新`__reactProps$`，此时`__reactProps$.value === 'a'`，`input.value === 'a'`
3. 进入`restoreStateOfTarget`, 因为`__reactProps$.value === input.value`，不会设置`input.value`

同步更新这里一直没有直接设置 input 的 value，所以光标不会重置。

### 异步更新

1. 输入 a，事件触发，此时`__reactProps$.value === ''`，`input.value === 'a'`
2. 没有状态更新，跳过 commit 阶段，此时`__reactProps$.value === ''`，`input.value === 'a'`
3. 进入`restoreStateOfTarget`，`__reactProps$.value !== input.value`，更新`input.value`为`''`, 此时`__reactProps$.value === ''`，`input.value === ''`
4. setTimeout 回调执行，执行`setText('a')`，此时`input.value === ''`
5. 进入 commit 阶段，此时`props.value === 'a'`，`input.value === ''`，所以更新`input.value`为`'a'`，同时更新`__reactProps$`
6. 进入`restoreStateOfTarget`, 值相同跳过设置

可以看到异步更新的时候，`input.value`会被设置两次，所以光标会被重置。

至于为什么增加一个 restore 阶段。react 在`finishEventHandler`注释里讲了原因，感兴趣可以了解下。

![image](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/react/image_6Y.webp)

# 方案

了解原因后，我们知道必须进进入 commit 阶段更新`__reactProps$`，所以能实现的方案不多。一种方案是增加一个同步更新的方法。

```jsx
let outText = "";
function App() {
  const [, setText] = useState("");
  const [, forceUpdate] = useState([]);
  function updateText(e) {
    const value = e.target.value;
    outText = value;
    forceUpdate([]);
    setTimeout(() => setText(value));
  }
  return <input value={outText} onChange={updateText} />;
}
```

另一种是不设置 value 值，改设置 defaultValue。

```jsx
function App() {
  const [text, setText] = useState("");
  function updateText(e) {
    const value = e.target.value;
    setTimeout(() => setText(value));
  }
  return <input defaultValue={text} onChange={updateText} />;
}
```
