import React, { Component } from 'react';

class FullPageLoader extends Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    return (
      <div id="loader-wrapper">
        <div id="loader-message" className="text-center lead">{typeof this.props.message === 'undefined' ? '' : this.props.message}</div>
        <div className="cssload-wrap">
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
          <div className="cssload-circle"></div>
        </div>
      </div>
    );
  }
}

export default FullPageLoader;
