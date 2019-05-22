import {ipcRenderer} from 'electron';
import { useGlobal } from 'reactn';
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';
//const path = require('electron').remote.require('path');
//const fs = require('electron').remote.require('fs');
//const { promisify } = require('electron').remote.require('util')
const {app,dialog} = require('electron').remote.require('electron');

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

import Config from './Config';
import msg from '../constants/ipcmessages';

export interface ICampaign {
	"id":string,
	"name":string,
	"author":string,
	"description":string,
	"progress":number,
	"installed":boolean,
	"entryPoint":string,
	"maps":Array<IMap>,
	"mods":Array<IMod>,
	"lastUpdated":string,
	"patchNotes":Array<object>,
	"screenshots":Array<string>,
	[key: string]: string|number|object|boolean|IMap|IMod
};

interface ISC2Component{
	"name": string,
	"description": string,
	"destination": string,
	"source": string,
	"sourceFormat": string,
	"fileEntry": string
}
export interface IMap extends ISC2Component {};

export interface IMod  extends ISC2Component{};

export interface IAuthor {
	"id":string,
	"name":string,
	"email":string,
	"campaigns":Array<object>

}
export default class Campaign {
	static getCampaignLocal = async (source:string) => {
		console.group("getCampaignLocal")
		const fullPath = path.join(app.getPath("userData"),"manifests/", source)
		
		console.log(fullPath); 
		const response:Buffer = await readFileAsync(fullPath);
		const json = response.toString();
		console.log(json);
		const campaign:Object = JSON.parse(json);
		console.log(campaign);
		console.groupEnd();
		return campaign;
	}
	static getCampaignRemote = async (source:string) => {
		const response:Response = await fetch(source);
		const campaign:ICampaign = await response.json();
		return campaign;
	}
	static getCampaignRunCommand = (campaign:ICampaign):string => {
		console.group("getCampaignRunCommand");
		const entryPoint = (campaign.entryPoint)?campaign.entryPoint:campaign.maps[0].destination;
		const entryPointPath = path.join(Campaign.getCampaignsInstallDir(),entryPoint)
		const command = Config.getRunCommand().replace("{map}",entryPointPath);
		console.log("command", command)
		console.groupEnd();
		return command;
	}
	static getCampaignRunParams = (campaign:ICampaign):Array<string> => {
		console.group("getCampaignRunParams");
		const entryPoint = (campaign.entryPoint)?campaign.entryPoint:campaign.maps[0].destination;
		const entryPointPath = path.join(Campaign.getCampaignsInstallDir(),entryPoint)
		const params = Config.getRunParams().map(e=>e.replace("{map}",entryPointPath))
		
		console.log("params", params)
		console.groupEnd();
		return params;
	}
	
	static getCampaignsRemote = async () => {
		const campaigns:Array<ICampaign> = await Promise.all(Config.getSources().map((source:string) => Campaign.getCampaignRemote(source)));
		return campaigns;
	}
	static getCampaignsLocal = async () => {
		console.group("getCampaignsLocal");
		const campaigns:object = await Promise.all(Config.getLocalSources().map((source:string) => {
			return Campaign.getCampaignLocal(source) 
		}));
		console.groupEnd();
		return campaigns;
	}
	static getCampaignsInstallDir = ():string => {
		return Config.getInstallDir();
	}
	static getCampaignsInstalled = (campaigns:Array<ICampaign>) => {
		const installedCampaigns:Array<ICampaign> = []
		campaigns.map(campaign => {
			const installedCampaign = {...campaign }
			installedCampaigns.push(installedCampaign)
			installedCampaign.installed = Campaign.isCampaignInstalled(installedCampaign);
		})
		return installedCampaigns;
	}
	static isCampaignInstalled = (campaign:ICampaign) => {
		console.group("isCampaignInstalled")
		console.log("campaign",campaign);

		let installed = true;
		const installDir = Campaign.getCampaignsInstallDir();
		const mapsExist = campaign.maps.reduce((existtotal, map) => {
			return existtotal && fs.existsSync(path.join(installDir,map.destination))
		},true);
		console.log("mapsExist",mapsExist);
		const modsExist = campaign.mods.reduce((existtotal, mod) => {
			return existtotal && fs.existsSync(path.join(installDir,mod.destination))
		},true);
		console.log("modsExist",modsExist);
		installed = mapsExist && modsExist;
		console.groupEnd()
		return installed;
	}

	static downloadCampaign = (campaign:ICampaign) => {
		console.log("downloadCampaign")
		ipcRenderer.send(msg.DOWNLOAD_CAMPAIGN, {...campaign, installDir:Campaign.getCampaignsInstallDir()});
	}
	static playCampaign = (campaign:ICampaign) => {
		console.group("playCampaign")
		const data = {
			...campaign, 
			installDir:Campaign.getCampaignsInstallDir(), 
			command: Campaign.getCampaignRunCommand(campaign),
			params:Campaign.getCampaignRunParams(campaign)
		};
		console.log("data", data);
		ipcRenderer.send(msg.PLAY_CAMPAIGN, data);
		console.groupEnd();
	}
	static emptyMap = ():IMap => {
		return {
			"name": "",
			"description": "",
			"destination": "",
			"source": "",
			"sourceFormat": "",
			"fileEntry": ""
		};
	}
}