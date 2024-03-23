import fs from "fs";
import path from "path";

const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
const oneDay = 1000 * 60 * 60 * 24;
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = Math.floor(diff / oneDay);
const week = Math.ceil(day / 7);

const currentWeek = `${year}-${week.toString().padStart(2, "0")}`;

const fileName = `${currentWeek}.md`;
const filePath = path.join(__dirname, "..", "note/week", fileName);

function num2str(num) {
  return num.toString().padStart(2, "0");
}

const template = `---
description: 好记性不如烂笔头，${year}年第${numberToChinese(week)}周周记
tags:
  - week
createdAt: ${year}-${month.toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}
---
`;
fs.writeFileSync(filePath, template);

console.log(`Markdown file created: ${filePath}`);
function numberToChinese(num) {
  var chineseNumArr = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  var unitArr = ["", "十", "百", "千"];

  var result = "";
  var numStr = num.toString();

  for (var i = 0; i < numStr.length; i++) {
    var digit = numStr.charAt(i);
    var unit = unitArr[numStr.length - 1 - i];
    result += chineseNumArr[parseInt(digit)] + unit;
  }

  result = result
    .replace(/零(十|百|千)/g, "零")
    .replace(/零+/g, "零")
    .replace(/零+$/g, "");

  return result;
}
