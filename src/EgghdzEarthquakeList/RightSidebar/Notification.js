import React, { Component } from 'react';

class Notification extends Component {
  constructor(props) {
    super(props);

    this.type = typeof props.type === 'undefined' ? '' : props.type;
  }

  determineClassNameByType(type) {
    let result = '';

    switch (this.type) {
      case 'muted':
      result = 'text-muted';
      break;

      case 'primary':
      result = 'text-primary';
      break;

      case 'success':
      result = 'text-success';
      break;

      case 'info':
      result = 'text-info';
      break;

      case 'warning':
      result = 'text-warning';
      break;

      case 'danger':
      default:
      result = 'text-danger';
    }

    return result;
  }

  render() {
    return (
      <div id="notification">
        <p className={this.determineClassNameByType(this.type)}>{typeof this.props.message === 'undefined' ? '' : this.props.message}</p>
      </div>
    );
  }
}

export default Notification;
