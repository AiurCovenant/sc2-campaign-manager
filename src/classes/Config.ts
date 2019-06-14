const os = require('electron').remote.require('os');
//const path = require('electron').remote.require('path');
const {app,dialog} = require('electron').remote.require('electron');
const {Registry} = require('electron').remote.require('rage-edit')
const {currentPlatform, platforms} = require("./Platform")
//const fs = require('fs');
import path from 'path'
import fs from 'fs'	

const manifestSource = "https://raw.githubusercontent.com/abrahamYG/sc2-campaign-manager/master/public/sources.json";
export interface IConfig {
	installDir:string, 
	runCommand:string, 
	runParams:string,
	campaignSources:Array<string>
	campaignLocalSources:Array<string>
}

export default class Config {
	static getConfigFilePath():string{
		return path.join(app.getPath("userData"), "config.json")
	}

	static showInstallDirOpenDialog(path:string, callback:(filePaths:Array<string>)=>void){
		const browserWindow:any = null;
		const options:any = {
			properties: ["openDirectory"],
			defaultPath: path
		}
		dialog.showOpenDialog(browserWindow, options, callback)
	}
	static configFileExists():boolean{
		const configFile = this.getConfigFilePath();
		return fs.existsSync(configFile);
	}
	static getSourcesRemote = async () => {
		const response:Response = await fetch(manifestSource);
		const sources:Array<string> = await response.json();
		return sources;
	}
	static loadFromDisk():any{
		let configs = {};
		console.group("loadFromDisk")
		if(this.configFileExists()){
			const configFile = this.getConfigFilePath();
			console.log("configFile",configFile)
			const data:Buffer = fs.readFileSync(configFile);
			console.log("data",data)
			console.log("data.toString()",data.toString())
			configs = JSON.parse(data.toString());
			console.log("configs",configs)
			console.groupEnd();
		}
		return configs;
	}
	static writeToDisk(configs:object):boolean{
		const jsonConfigs = JSON.stringify(configs,null,4);
		const configFile = this.getConfigFilePath();
		fs.writeFileSync(configFile, jsonConfigs);
		return true;
	}
	static installDirFromRegistry:string = "";
	static async getInstallDirFromRegistry() {
		if (currentPlatform === platforms.WINDOWS) {
			const result = await Registry.get('HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\StarCraft II', 'InstallLocation');
			this.installDirFromRegistry = result? result:"";
			return this.installDirFromRegistry;
		}
		else{
			//return this.installDir;
		}
	}
	static getSources():Array<string> {
		return  Config.configFileExists()&&Config.loadFromDisk().campaignSources? (Config.loadFromDisk().campaignSources):[""];
	}
	
	static getLocalSourcesPath():string {
		const basePath = path.join(app.getPath("userData"), "manifests/");
		return  basePath;//Config.configFileExists()&&Config.loadFromDisk().campaignLocalSources? (Config.loadFromDisk().campaignLocalSources):[""];
	}
	static getLocalSources():Array<string> {
		const basePath = Config.getLocalSourcesPath();
		const localSources:Array<string> = (fs.existsSync(basePath))?fs.readdirSync(basePath).
			filter(file => path.extname(file) === ".json").
			map(source => path.join(basePath,source)):[];

		console.log("getLocalSources",localSources);
		return  localSources;//Config.configFileExists()&&Config.loadFromDisk().campaignLocalSources? (Config.loadFromDisk().campaignLocalSources):[""];
	}
	static getInstallDir():string {
		const fromRegistry = this.installDirFromRegistry;
		const dir:any = {
			WINDOWS:fromRegistry?fromRegistry:"C:\\Program Files (x86)\\StarCraft II",
			MAC:"/Applications/StarCraft II",
			LINUX:"C:\\Program Files (x86)\\StarCraft II"
		};
		console.log("this.installDirFromRegistry",fromRegistry);
		console.log("dir[currentPlatform]",dir[currentPlatform]);
		return Config.configFileExists()? (Config.loadFromDisk().installDir):dir[currentPlatform];
	}
	static getRunCommand(baseDir?:string):string {

		const commands:any = {
			WINDOWS:path.join(baseDir?baseDir:Config.getInstallDir(),"Support64/" ,"SC2Switcher_x64.exe"),
			MAC:"open",
			LINUX:"wine \"C:\\Program Files (x86)\\StarCraft II\\StarCraft II.exe\""
		};
		return Config.configFileExists()? (Config.loadFromDisk().runCommand):commands[currentPlatform];
	}
	static getRunParams():Array<string> {
		const defaultParams:any = {
			WINDOWS:'-run {map} -reloadcheck',
			MAC:"-a {map} \"sc2switcher\"",
			LINUX:"-run {map} -reloadcheck"
		};
		const params = Config.configFileExists()&&Config.loadFromDisk().params? (Config.loadFromDisk().params):defaultParams[currentPlatform];
		return params.split(" ");
	}
	
}