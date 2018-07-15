import React, { Component } from 'react';

class ScrollDownButton extends Component {
  render() {
    return (
      <div id="scroll-down-button">
        <a href="#right-sidebar" onClick={this.props.handleClick}><span></span>Scroll</a>
      </div>
    );
  }
}

export default ScrollDownButton;
