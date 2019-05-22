import React, {Component} from 'react';
import ManifestList from '../components/ManifestList';
import ManifestEditor from '../components/ManifestEditor';

import Campaign, {ICampaign} from '../classes/Campaign'


interface IMapMakerPaneState{
	"campaigns": Array<ICampaign>, 
	"authors": any,
	"selectedCampaign": ICampaign, 
	"selectedCampaignAuthor": any
}

class MapMakerPane extends Component<any, IMapMakerPaneState> {
	constructor(props:any){
		super(props);
		this.state = {
			"campaigns": [], 
			"authors": null,
			"selectedCampaign": null, 
			"selectedCampaignAuthor": null
		};
		Campaign.getCampaignsLocal().then((campaigns:Array<ICampaign>) =>{
			this.setState({campaigns})
			
		})
	}
	handleCampaignItemClick = (campaign:ICampaign) => {
		console.group("handleCampaignItemClick")
		this.setState({selectedCampaign: campaign});

		console.groupEnd();
	};

	setCampaign = (campaign:ICampaign) => {
		const campaigns = [...this.state.campaigns];
		const index = campaigns.findIndex(v => v.id === campaign.id);
		console.log("setCampaign", campaign);
		console.log("setCampaign", campaigns);
		campaigns[index] = campaign;
		this.setState({campaigns, selectedCampaign:campaign})

	};

	render(){
		const {selectedCampaign, campaigns} = this.state;
		//const {schema, campaign} = this.state;
		const {selectedCampaignAuthor, onCampaignItemClick} = this.props;
		const uiSchema = {};
		return (
			<div className="row">
				<section className="sidebar col-3 bg-secondary pr-0 pl-0">
					{(campaigns) &&
					<ManifestList 
						onClick={this.handleCampaignItemClick} 
						campaigns={campaigns}
						selectedCampaign={selectedCampaign}
						selectedId={(selectedCampaign)?selectedCampaign.id:""}
						
					/>
					}
				</section>
				<section className="manifest-editor-pane col bg-light">
					{(selectedCampaign) &&
						<ManifestEditor
							campaign={ {...selectedCampaign} }
							setCampaign={this.setCampaign}
						/>
					}
					{(!selectedCampaign) &&
						<div className="pure-u">
							<p>No data Loaded</p>
						</div>
					}
				</section>
			</div>
		);
	}

}

export default MapMakerPane;