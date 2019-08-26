import React, { Component } from 'react';
import Table from './components/Table.js';
   function epochToJsDate(ts){
        // ts = epoch timestamp
        // returns date obj
        return new Date(ts*1000);
   }

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      droplets: []
    }
  }
componentDidMount() {
    fetch('/json/runs')
    .then(res => res.json())
//    .then(json => function(json){
//return(json);
//    })
//    .then(droplets => this.setState({ 'droplets': droplets }))
.then((data) => {
for (var i = 0; i < data.length; i++){
var datum = data[i];
datum['date'] = epochToJsDate(datum['epoch']);
data[i] = datum;
}
      this.setState({ droplets: data })
    })
  }
  render() {
    return (
      <div className="App">
        <Table droplets={ this.state.droplets } />
      </div>
    );
  }
}

export default App;
