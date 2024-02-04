const fs = require("fs");
const path = require("path");

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

const template = `---
description: 好记性不如烂笔头，${year}年第五周周记
tag: week
createDate: ${year}-${month.toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}
---
`;
fs.writeFileSync(filePath, template);

console.log(`Markdown file created: ${filePath}`);
