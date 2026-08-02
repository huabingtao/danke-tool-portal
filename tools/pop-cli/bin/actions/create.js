const inquirer = require("inquirer");
const path = require("path");
const dl = require("download-git-repo");
const fse = require("fs-extra");
const ora = require("ora");
const loading = ora("Loading");
const { config } = require("../repo.js");

const createProject = async (appName, options) => {
  const prompList = [
    {
      type: "input",
      name: "description",
      message: "请输入项目描述信息:",
    },
  ];
  if (!options.template) {
    prompList.push({
      type: "list",
      message: "请选择一个模板下载:",
      name: "template_name",
      choices: Object.keys(config),
    });
  }
  const { template_name: template_value, description } = await inquirer.prompt(
    prompList
  );
  // console.log(template_value,description)
  if (options.template) {
    template_name = options.template;
  } else {
    template_name = template_value;
  }
  const project_dir = path.join(process.cwd(), appName); //新键项目的路径
  // console.log('template_name:',template_name);
  await download(template_name, project_dir);
  await updatePackage(project_dir, {
    name: appName,
    description,
    template: template_name,
  });
};

const updatePackage = async (dirpath, data) => {
  const filepath = path.join(dirpath, "package.json");
  try {
    await fse.ensureFile(filepath);
    let packageJson = await fse.readFile(filepath);
    packageJson = JSON.parse(packageJson.toString());
    packageJson = { ...packageJson, ...data };
    packageJson = JSON.stringify(packageJson, null, "\t");
    await fse.writeFile(filepath, packageJson);
  } catch (error) {}
};

const download = async (template_name, project_dir) => {
  const { url } = config[template_name];
  await fse.emptyDir(project_dir);
  let count = 0;
  const execuate = () => {
    count++;
    if (count >= 5) {
      count = 0;
      Promise.reject();
      return;
    }
    load.startLoading();
    dl(`${url}`, project_dir, async function (err) {
      load.endLoading();
      if (err) {
        await sleep();
        execuate();
      } else {
        Promise.resolve();
        count = 0;
      }
      Promise.resolve(null);
    });
  };
  execuate();
};

const load = {
  startLoading: (text = "加载中...") => {
    loading.text = text;
    loading.color = "green";
    loading.start();
  },
  endLoading: () => {
    loading.stop();
  },
};

const sleep = async (time = 3000) => {
  setTimeout(() => {
    Promise.resolve();
  }, time);
};

module.exports = createProject;
