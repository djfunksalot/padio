const testAddon = require('./build/Release/testaddon.node');
const WebSocket = require('ws');
 
const ws = new WebSocket('ws://padio:6789');

//const devmap = [[16,16],[0,9],[0,10],[0,14],[9,0],[0,13],[0,15]];
//device map for org design
const devmap = [[16,16],[2,0],[0,3],[3,0],[0,4],[4,0],[0,5],[5,0],[0,7],[6,0],[7,0],[8,0],[0,8],[11,0],[0,9],[10,0],[0,10],[9,0],[0,11],[0,12],[12,0],[0,13],[0,6],[0,14],[13,0],[0,15],[15,0],[14,0]];
//device map for squares design
//const devmap = [[16,16],[3,0],[];

function did_to_dev (did) {
	len = devmap.length
	i = did % len
	return(devmap[i])


}
 
//ws.on('open', function open() {
//  ws.send('something');
//});
 
ws.on('message', function incoming(json) {
	//
	data = JSON.parse(json)
	console.log(data)
	var channel = did_to_dev(data.value_did)
	console.log(channel)
        console.log('channel ', testAddon.channel(channel[0], channel[1]));

});
