const { logger } = require("./logger");
const { sendNotify } = require("./push");

const { CloudClient, FileTokenStore } = require("../sdk/index");
const fs = require("fs");
const path = require("path");

let clients = new Map();
let good = new Set();
let bad = new Set();
let outputLogs = []; // 记录所有输出

const getCloudClient = async (userName, password) => {
  if (clients.has(userName)) return clients.get(userName);

  let token = new FileTokenStore(`.token/${userName}.json`);

  let c = new CloudClient({
    username: userName,
    password: password,
    token: token,
  });
  clients.set(userName, c);
  const filePath = path.join(process.cwd(), `.token/${userName}.json`);
  if (!fs.existsSync(filePath)) {
    logger.log(`${userName} login...`);
    await c.getSession();
  }
  return c;
};

const createToken = () => {
  folderPath = "./.token";
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  } else {
  }
};


const set2str = (set)=>{
  let data = Array.from(set);
  return data.join("\n")
}

const logOutput = (message) => {
  outputLogs.push(message);
  console.log(message);
}

const main = async () => {
  createToken();

  let jer = fs.readFileSync("tyys.txt", "utf8").trim().split(/[\n\t\r ]+/);;
  for (let i = 0; i < jer.length - 1; i += 2) {
    const [userName, password] = jer.slice(i, i + 2);
    try{
      let c = await getCloudClient(userName,password)
      let space = await c.getUserSizeInfo();
      await c.userSign(),
      h = `${(i/2)+1}/${Math.floor(jer.length/2)}.`
      let msg = `${h.padEnd(10,' ')} ${userName}  ${(space.cloudCapacityInfo.totalSize/1024/1024/1024).toFixed(2)}G -- ${(space.familyCapacityInfo.totalSize/1024/1024/1024).toFixed(2)}G`
      logOutput(msg)
      good.add(`${userName.padEnd(12,' ')}  ${password.padEnd(25,' ')} ${(space.cloudCapacityInfo.totalSize/1024/1024/1024).toFixed(2)}G -- ${(space.familyCapacityInfo.totalSize/1024/1024/1024).toFixed(2)}G`)
    }catch(e){
      let errMsg = `${userName}  --  ${e.message}`
      logOutput(errMsg)
      bad.add(`${userName} \t ${password}`)
    }
  }

  try {
    fs.writeFileSync("good.txt", set2str(good), "utf8"); // 写入文件，指定编码为 utf8
    fs.writeFileSync("bad.txt", set2str(bad), "utf8"); // 写入文件，指定编码为 utf8
    
    // 准备推送内容
    const summary = `检查完成\n\n成功: ${good.size}\n失败: ${bad.size}`;
    const detailedLogs = outputLogs.join("\n");
    const pushMessage = `${summary}\n\n${detailedLogs}`;
    
    // 调用push推送所有记录
    try {
      await sendNotify("云189账户检查结果", pushMessage);
      logger.log("推送成功");
    } catch (pushErr) {
      logger.log("推送失败: " + pushErr.message);
    }
  } catch (err) {}
};

(async () => {
  try {
    await main();
  } finally {
    logger.log("\n\n");
  }
})();
