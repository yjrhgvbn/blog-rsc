---
description: flex 布局算是前端的必修课了，而这篇文章就讲讲我是如何理解 flex 布局的。
createdAt: 2024-03-03T08:49:39.165Z
draft: false
tags:
  - css
updatedAt: 2024-03-03T10:06:08.141Z
---

这篇文章不会具体讲各个属性有什么效果，只会简单介绍下部分属性。相反，这篇文章主要讲的是我是怎么理解 flex 布局，在我看来，属性的意义是什么，这个命名有用什么含义。这篇文章建议配置这个[网站](https://flexbox.help)一起使用

在文章开始前，如果你熟悉`flex`，不妨先看看下几个问题

1. 不使用`align-items`和`align-self`能让 flex 布局的元素水平垂直居中吗？
2. 在 flex 布局使用`justify-items`和`justify-self`有什么效果？
3. flex 布局能做到一个元素靠左，其他元素靠右的效果吗

# 假设你是设计师

没什么能比作者本人更了解自己的作品了，身临其境无疑是最好的理解方式。所以现在假设目前没有`flex`或者`grid`布局，而你正在制定 css 标准，现在希望设计一个水平方向的布局，能在一行中排列多个块级元素。

## 水平布局的问题

在互联网上，通常有个常识，如果垂直方向内容溢出页面的话，通常可以通过滚动页面来查看溢出的内容。

但水平方向溢出却比较少见，一般来说，水平滚动不符合人们的阅读习惯，现代设备对应水平滚动的操作也不太友好，如果没有明确的指示，用户很难意识到页面可以水平滚动。所以在设计布局时，你要避免内容溢出容器而且出现滚动。

## 开始

为了适应各种设备的宽度并避免溢出，你设计的布局要非常**灵活**地处理宽度，`flexible`这个单词形容这个布局再合适不过了。为了方便书写，你决定用`flex`来命名你的布局。

现在你确定了你布局的名字 (`flex`)，你很快设计出了第一版，目前元素只需要在水平方向上靠右，垂直方向靠上就好。我们用 A、B、C 这三个不等高的元素做个演示。

```css
.content {
  height: 200px;
  display: flex;
}
.item {
  background-color: red;
  width: 100px;
}
.a {
  height: 100px;
}
.b {
  height: 50px;
}
.c {
  height: 150px;
}
```

```html
<div class="content">
  <div class="item a">A</div>
  <div class="item b">B</div>
  <div class="item c">C</div>
</div>
```

![base flex layout](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/base_flex_layout_Bc.webp)

### flex-basis

现在这三个元素宽度都是 100px，并且能完全展示，但就像之前说的，我们的宽度是不定的，布局的元素可能需要随着容器的宽度变化，这需要一个针对`flex`布局的属性。这块很容易理解，使用`flex-basis`来设置元素在这个布局的默认宽度，然后使用`flex-grow`和`flex-shrink`来控制元素随着容器宽度变化的幅度。这部分不是本文的重点，就略过了。

## 单行

作为设计师，你打算一步步来，先处理完单行展示的情况。

### justify-content

再看我们开始的例子，看看有什么可以改进的地方。

![base flex layout](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/base_flex_layout_hk.webp)

你发现目前布局中右侧还有一块空间，而且元素却都集中在左侧，这个看上去不太美观。所以你打算先对这块做优化，让元素在有额外空间时能展示的更灵活些，大概有两个方案。

1. 手动将布局分割成多个空间，手动设置每个空间的大小，每个元素只能占据一个或多个空间。这样处理非常灵活，但需要预先设置每行的元素个数。
2. 让布局内的元素按照预定的规则对齐，例如让元素在容器内均匀分布，或者让元素在容器内居中展示。这样不需要预先设置每行的元素个数，但是不够灵活。

每个方案都有优缺点，选哪个都没什么问题，当然最后`flex`使用了第二个方案，而第一个方案交给了`grid`。

现在确定了布局的对齐方式，需要给它起个名字。因为这个属性控制了布局内的**元素**和**空间**，也就是布局的**内容**，自然联想`content`这个单词，但你还需要加个修饰词。毕竟`content`范围比较空泛，你打算找个有**排序**或者**对齐**含义的单词，比如`justify`，组合起来就是`justify-content`，这个名字看起来命名很合理。

后面是确认各类规则的事情了，就不具体介绍了，可以点[这里](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content)了解。现在尝试下在`.content`类中加上`justify-content: space-between`，让布局均匀排列每个元素。

![flex layout with justify-content: space-between](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/flex_layout_with_justify-content:_space-between_jv.webp)

### align-self

继续看看布局还有什么需要提升的地方，在垂直方向上，A、B、C 三个元素下方都还有空间，这个看上去也不太美观。所以你下个目标是控制元素在容器内垂直方向的展示位置。一般来说，我们容器的高度由最高的元素决定，但这里容器自己设置了高度，所以所有元素下方都存在空间。

现在，你希望 A 元素能垂直居中，你会怎么办呢？你也许想说给 A 元素加个新属性，但在这个例子中有些大材小用了，你其实可以使用`margin`实现垂直居中

```css
.a {
  margin-block: auto;
  height: 100px;
}
```

![flex layout with margin](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/flex_layout_with_margin_Mh.webp)

事实就是真实的 flex 标准，这块可以通过`margin`和`height`组合做出类似的效果。但最后你还是觉得加个属性进行控制，一方面是为了语意更加清晰，另一方也是为了一些 flex 布局独特的对齐方式，例如根据布局的文字对齐（baseline）。

所以又到了命名时间了，含义是控制元素自身在垂直方向的对齐方式。最后的结果大家应该情况，是`align-self`, 是**alignment 的缩写**加**self**的组合，校准自身的意思。但在我看来，`align`没有表达出方向的含义，和`justify`没太多的区分，不算一个特别好的命名。在记忆名字时，你需要在脑海里将`justify`与水平方向关联，`align`与垂直方向关联。

后面又是确认各类规则的事情了，就不具体介绍了，可以点[这里](https://developer.mozilla.org/en-US/docs/Web/CSS/align-self)了解。现在试下把 a 类的`margin-block: auto;`改为`align-self: center;`，也会是同样的效果。

当然，给每个元素都单独设置`align-self`不免有些麻烦，你增加一个`align-item`的属性，可以给 flex 布局内所有的元素设置了一个默认值。

## 换行

现在单行的内容处理差不多了，是时候进一步处理下换行问题了，水平布局总是不可避免重新内容超出宽度的问题，这时候需要换行展示。

像文字一样，你把换行的权限分了用户，增加了一个`flex-wrap`属性。

为了演示换行效果，需要增加几个元素，现在的 html 和 css 应该是这样

```css
.content {
  height: 400px;
  display: flex;
  justify-content: space-between;
  align-content: start;
  flex-wrap: wrap;
}
.item {
  background-color: red;
  width: 100px;
}
.a {
  height: 100px;
}
.b {
  height: 50px;
}
.c,
.d,
.e,
.f {
  height: 150px;
}
```

```html
<div class="content">
  <div class="item a">A</div>
  <div class="item b">B</div>
  <div class="item c">C</div>
  <div class="item d">D</div>
  <div class="item e">E</div>
  <div class="item f">F</div>
</div>
```

![flex layout with wrap](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/flex_layout_with_wrap_oQ.webp)

注意，这里加了`align-content: start`只是为了更好的说明，因为默认情况下多行会自动分配空间，但毕竟我们现在假设没有 flex 布局，所以我们让多行之间向上靠齐，这样更符合我们的假设。

对于新的一行，只需要按上面的规则原样处理就好，现在我们只关注每一行之间的关系。

### align-content

现在让我们做个抽象处理，我们并不关注行内的元素，我们只关系行之间的关系，那么把一行当成一这个整体看待，现在就类似于在处理这种情况。
![abstract line](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/abstract_line_Dh.webp)

是不是感觉似曾相识，没有？别着急，让我们逆时针旋转 90 度再看下。

![abstract line with turning counterclockwise](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/abstract_line_with_turning_counterclockwise_y1.webp)

看出来了吗？这个和我们介绍`justify-content`时的例子非常类似，只是这次由水平方向改为了垂直方向

既然问题类似，那么自然也能用类似的方案处理，只是方向有些变化。所以你打算重复`justify-content`的思路，属性值也是基本可以复用，只需要起个好名字，正好之前提到`align`有垂直方向的含义，那就取个类似的名字：`align-content`。

事实上`align-content`和`justify-content`也是有些区别的，主要是在文字的展示上，所以属性值也有部分差异，可以查看[这里](https://developer.mozilla.org/zh-CN/docs/Web/CSS/align-content)。

现在尝试在 content 类中加入`align-content: space-between`

![flex layout with align-content space-between](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/flex_layout_with_align-content_space-between_xR.webp)

### justify-self

既然`align-content`是基本沿用`justify-content`的设计，那么是不是有`justify-self`属性，也可以沿用`align-self`呢。的确，css 有[justify-self](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-self)属性，但在 flex 布局中这块并不会生效。

回想下我们为什么引入了`align-self`，是因为处理单行时，垂直方向上的元素还有空余空间。那现在换到多行的情况下，`justify-self`就是处理水平方向上每行，但就像上面图片展示的，每行宽度都是 100%，没有空余空间，没办法做到水平移动，所以`justify-self`不会生效。同样的，[justify-items](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-items)也不会生效。

## 方向

在上面介绍 flex 时，我们一直假设单行方向是水平从左到右的，但在介绍`align-content`时，我们把每一行抽象成一个元素，就类似于垂直方向从上到下的单行布局。所以你可以发现这个布局不必局限在水平方向。

如果你之前学过 flex，应该有听过主轴和交错轴的概念，现在我们也是时候引入这个概念了。当然你不必过度纠结这个概念，引入轴是为了更好的表示布局的方向，要是觉得这个说法不能帮你确认布局的方向，你也可以抽象成其他概念。

![flex-axis](https://jsd.cdn.zzko.cn/gh/yjrhgvbn/blog-rsc@main/public/css/flex-axis_kl.webp)

主轴，可以理解是单行时元素的排列方向，默认情况下和文本方向一致的，在中文环境下是水平从左到右。

交错轴，垂直于主轴的轴，他的方向是由`flex-wrap`控制的。`flex-wrap: wrap`是主轴顺时针旋转 90 度，`flex-wrap: wrap-reverse`是主轴逆时针旋转 90 度。

引入了轴的概念后，我们还需要一个属性实现确认主轴的方向，你起了个意义比较明确的单词`flex-direction`。为了适应不同语言的习惯，你打算让这个属性与书写方向绑定。`flex-direction: row`就是我们文字书写的方向（中文是从左到右的水平轴），而`flex-direction: column`就是我们多行文字换行的方向（中文是从上到下的垂直轴）。

# 最后

其实本来是打算和 grid 合一起写一篇的，但时间有限，有时间后面再补充一篇 grid 的
