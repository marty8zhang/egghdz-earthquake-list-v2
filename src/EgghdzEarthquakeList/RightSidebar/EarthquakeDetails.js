import React, { Component } from 'react';

class EarthquakeDetails extends Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    return (
      <div id="earthquake-details">{typeof this.props.details === 'undefined' ? '' : this.props.details}</div>
    );
  }
}

export default EarthquakeDetails;
