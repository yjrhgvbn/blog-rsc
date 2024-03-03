---
createdAt: 2023-06-26T09:13:27.000Z
draft: false
description: 记录下ssr改造遇到的一些问题
tags:
  - react
updatedAt: 2024-03-03T10:06:21.767Z
---

最近花时间吧网站改造成ssr，主要是为了首屏展示的优化，因为之前是使用Suspense挂着路由的，所以每次都需要展示一次路由加载的loading和查询数据的loadloading，体验不太好。

# 改造

## 动态路由修改

之前为了方便所以react的lazy和Suspense配合实现动态路由，但在react18，在ssr会直接加载fallback，对于路由页面这样可能是不合适的，这里可以使用动态import，根据路由先加载目标页面后返回，不过这个不需要我们自己实现，在[React Router](https://reactrouter.com/en/main/guides/ssr)就有相关的功能。

## document和window处理

在服务器渲染时是没有这两个对象的，可以在使用前加个判断，或者使用[ssr-window](https://www.npmjs.com/package/ssr-window)，给当前环境增加相关方法，这里只是模拟，实际上会一直返回空值

## react提示425，418等错误

这里情况一般表示服务器渲染和客户端渲染的结果不一致，可以通过这里查看具体提示[官网](https://legacy.reactjs.org/docs/error-decoder.html/?invariant=425)，虽然一般这个错误并不会影响运行，但可能导致页面重绘。路由配置或者使用window都有可能出现这种情况，服务器和客户端环境不一致也会这种情况，例如服务器和客户端的时区不一样，使用`new Data()`的结果会不同，也会导致相关错误。

# 踩坑

## vite打包的服务器文件运行失败

vite在打包服务器运行的文件时，默认是不打包依赖的文件的，但包的打包格式并不统一，直接运行可能会报错。在vite.config配置`ssr: {format: 'cjs'}`，将依赖一起打包成cjs格式，这样就可以直接运行了，部署到服务器上体积也少很多，缺点是打包时间增加了很多。

## Suspense相关

## renderToPipeableStream

在react18中，使用renderToString在服务端渲染[Suspense](https://react.dev/reference/react/Suspense)的异步组件时，服务器第一次渲染会返回返回一个带错误信息（见下面）的temple元素，导致页面与客户端渲染结果不一致。想避免这个问题，可以使用react18的一个新api[renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)，可以在服务端渲染时渲染的异步加载组件，因为目前我还要拿到html元素做一些处理，就在服务端直接读取PipeableStream为string，代替了之前的renderToString。

> The server did not finish this Suspense boundary: The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToPipeableStream" which supports Suspense on the server

```typescript
const renderToString = async (element: JSX.Element) => {
  return new Promise((resolve, reject) => {
    const stream = ReactDOMServer.renderToPipeableStream(element, {
      onAllReady() {
        const chunks: Buffer[] | Uint8Array[] = [];
        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(Buffer.from(chunk));
            callback();
          },
        });
        writable.on("error", (error) => reject(error));
        writable.on("finish", () => {
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
        stream.pipe(writable);
      },
      onError(error) {
        reject(error);
      },
    });
  });
};
```

## @apollo/client

为了避免客户端重新请求接口，在服务端渲染会使用[@apollo/client](https://www.apollographql.com/docs/react/performance/server-side-rendering/#executing-queries-with-getdatafromtree)将请求的数据放到html中，客户端直接使用。在官方介绍，是通过`getDataFromTree`渲染并获取数据，这个方法会调用renderToString，但就像上面说的，这个方法存在一些问题，这里可以使用getMarkupFromTree方法，这个虽然官方文档没介绍，但确实可以直接引入使用的，这个方法可以让我们指定一个渲染方法，我们只需要传进去我们前面的renderToString方法就可以，`const content = await getMarkupFromTree({ tree: contentJsx, renderFunction: renderToString });`。

另一个方法是忽略`getDataFromTree`渲染返回的字符串，重新调用我们的renderToString方法，但这样子在服务端渲染了两次页面，不是很推荐。
