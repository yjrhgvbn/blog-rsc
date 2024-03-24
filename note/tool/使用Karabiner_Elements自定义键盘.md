---
draft: false
description: |
  karabiner-elements 是一款很强大的 mac 开源改建软件，可以通过配置设置自己自定义的映射规则，甚至可以执行控制台命令！
createdAt: 2023-05-03T09:16:41.000Z
updatedAt: 2024-03-24T11:05:24.428Z
---

# Karabiner Elements

[karabiner-elements](https://karabiner-elements.pqrs.org/)是一款很强大的 mac 开源改建软件，可以通过配置设置自己自定义的映射规则，甚至可以执行控制台命令！

当然，Karabiner Elements 是支持导入导出的，[官方收藏馆](https://ke-complex-modifications.pqrs.org/)收集了很多配置，可以直接导入，例如我之前使用的[Capslock 改建](https://github.com/Vonng/Capslock)，功能强大也有中文说明。

如果打算自己增加规则，可以查看官方推荐的一些[工具](https://karabiner-elements.pqrs.org/docs/json/external-json-generators)，会`typescript`的话，使用[karabiner.ts](https://github.com/evan-liu/karabiner.ts)用脚本生成是最方便的。这里也是使用这个库生成的，个人完整的项目地址在[这里](https://github.com/yjrhgvbn/karabiner-config)，除了使用脚本生成规则之外，也会读取配置文件生成相关文档。

# 安装 Karabiner Elements

这里不过多解释，跟着文档[安装](https://karabiner-elements.pqrs.org/docs/getting-started/installation/)就好，安装完注意图里的几个点就好。

![](https://s2.loli.net/2023/07/02/qScBK59TgRNjDfW.png)

## 第一个映射

首先在 profiles 里增加一个名为 test 的配置，打开配置文件位置，打开 karabiner.json，可以看到`profiles`属性，是一个数组，找到`name`为`test`的对象，这个就是新建的配置了，这个对象有个 `complex_modifications`，里面的 ruler 属性就是我们自定义的映射，可以先通过[Karabiner Complex Rules Generator](https://genesy.github.io/karabiner-complex-rules-generator/)生成导入几个配置测试下

![](https://s2.loli.net/2023/07/02/zKZgsNj14ekHtcI.png)

先来个例子简单了解基本配置，`shift` + `a` 映射成 `b`,

```json
{
  "description": "测试",
  "manipulators": [
    {
      "type": "basic",
      "from": { "key_code": "a", "modifiers": { "mandatory": ["left_shift"] } },
      "to": [{ "key_code": "b" }]
    }
  ]
}
```

上面一个规则的配置，description 是这个规则的描述，manipulators 是具体映射，可以有多个值，主要看第一个对象。

* type 表示这个映射类型，基本是 basic，其他类型可以查看[官网](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/other-types/)。

* from 表示映射的输入，`key_code` 可以看的出来，表示的是按下的按钮，modifiers 是对基础键的修饰，mandatory 表示必须与基础键一起出现的键，这里是左 shift

* to 表示映射的输出，这里表示按下 b 键

如果需要知道某个按键对应的 `key_code`，可以打开提供的另一个 app，[Karabiner EventViewer](https://karabiner-elements.pqrs.org/docs/manual/operation/eventviewer/)查看，安装时会自动安装。

## 使用 karabiner.ts

使用 karabiner.ts 可以提供类型提示和校验，比直接修改配置要方便非常多

运行`yarn add karabiner.ts typescript ts-node`进行安装，新建`index.ts`文件，生成同样配置的代码如下

```typescript
import { map, rule, writeToProfile } from "karabiner.ts";
const ruler = [
  rule("测试").manipulators([
    map({
      key_code: "a",
      modifiers: {
        mandatory: ["left_shift"],
      },
    }).to({ key_code: "b" }),
  ]),
];
writeToProfile("test", ruler);
```

使用`ts-node index.ts`命令运行，会自动生成并更新配置文件，对应上面的配置应该很容易看出代码的意思，这里不多介绍了，具体可以看[官网](https://github.com/evan-liu/karabiner.ts)。

# 将一个按键作为修饰键

像 Shift、Ctrl 一般都称为修饰键，通常与其他按键组合使用，可以实现不同的操作或快捷键功能，而通过 Karabiner，可以将任意键作为修饰键，实现自定义的快捷操作，也不用担心冲突。

在设置修饰键前，有一个要考虑的事情是否要输出修饰键，如果是 capslock 作为修饰键，这里可以忽略，但如果希望分号 (;) 之类的作为修饰键，就需要考虑不同情况了。有个简单的方法就是按下时直接输出修饰键，在匹配到指定按钮时，先进行一次删除操作，缺点是点击太快也可能会触发。

## 分号 (;) + a 映射 感叹号 (!)

```typescript
import { map, complexModifications, rule, writeToProfile, FromKeyCode, ToKeyCode } from "karabiner.ts";

export const PUNCTUATION_KEY_ID = "punctuation_flag";
export const PUNCTUATION_KEY = "semicolon";
export const PUNCTUATION_KEY_DESC = "分号";

const ruler = [rule("测试").manipulators([initPunctuation(), punctuationKeyBind("a", "1", "分号 (;) + a 映射 感叹号 (!)")])];

function initPunctuation() {
  return map({ key_code: PUNCTUATION_KEY })
    .description(`${PUNCTUATION_KEY_DESC}作为符号键`)
    .to([{ key_code: PUNCTUATION_KEY }, { set_variable: { value: 1, name: PUNCTUATION_KEY_ID } }])
    .toAfterKeyUp({ set_variable: { value: 0, name: PUNCTUATION_KEY_ID } });
  // .toIfAlone({ key_code: PUNCTUATION_KEY });
}

function punctuationKeyBind(fromKey: FromKeyCode, toKey: ToKeyCode, dec: string = "") {
  return map({ key_code: fromKey })
    .description(dec)
    .condition({ name: PUNCTUATION_KEY_ID, value: 1, type: "variable_if" })
    .to([{ key_code: "delete_or_backspace" }, { key_code: toKey, modifiers: ["left_shift"] }]);
}

writeToProfile("test", ruler);
```

```json
{
  "rules": [
    {
      "description": "测试",
      "manipulators": [
        {
          "type": "basic",
          "from": { "key_code": "semicolon" },
          "description": "分号作为符号键",
          "to": [{ "key_code": "semicolon" }, { "set_variable": { "value": 1, "name": "punctuation_flag" } }],
          "to_after_key_up": [{ "set_variable": { "value": 0, "name": "punctuation_flag" } }]
        },
        {
          "type": "basic",
          "from": { "key_code": "a" },
          "description": "分号 (;) + a 映射 感叹号 (!)",
          "conditions": [{ "name": "punctuation_flag", "value": 1, "type": "variable_if" }],
          "to": [{ "key_code": "delete_or_backspace" }, { "key_code": "1", "modifiers": ["left_shift"] }]
        }
      ]
    }
  ]
}
```

* `set_variable` 设置变量，这里设置了一个变量，当分号按下时，设置为 1，松开时设置为 0，这里是为了判断是否按下分号，如果按下分号，再按下其他键，就会触发映射。
* `to_after_key_up` 松开按键后触发的操作，这里是清空变量
* conditions 条件，这里是判断变量是否为 1，如果不为 1，就不会触发映射，这里的变量名要与上面的一致。

## 设置多个修饰键

karabiner 通过了 simultaneous 方法，当同时按下多个键时，触发映射，这里可以设置多个修饰键，比如同时按下`l`+`;`，就可以触发映射。
把`{ "key_code": "semicolon" }`修改为`{ "simultaneous": [{ "key_code": "l" }, { "key_code": "semicolon" }] }`就可以了。

# 最后

Karabiner Elements 其他方法也是大同小异，可以参考[官方文档](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/)，最后附上个人的配置[地址](https://github.com/yjrhgvbn/karabiner-config)
