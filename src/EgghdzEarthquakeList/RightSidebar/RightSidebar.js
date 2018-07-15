import React, { Component } from 'react';
import Notification from './Notification.js'
import SettingsForm from './SettingsForm.js'
import EarthquakeDetails from './EarthquakeDetails.js'

class RightSidebar extends Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    const hasNotification = typeof this.props.message !== 'undefined' && this.props.message.trim() !== '';

    return (
      <div id="right-sidebar" className="col-md-4">
        {hasNotification &&
          <Notification
            message={this.props.message}
            type={typeof this.props.messageType === 'undefined' ? '' : this.props.messageType} />
        }
        <SettingsForm
          timezone={this.props.timezone}
          locale={this.props.locale}
          location={this.props.location}
          radius={this.props.radius}
          feed={this.props.feed}
          handleFieldChange={this.props.handleSettingsFormFieldChange}
          handleSubmit={this.props.handleSettingsFormSubmit} />
        {typeof this.props.earthquakeDetails !== 'undefined' &&
          <EarthquakeDetails details={this.props.earthquakeDetails} />
        }
      </div>
    );
  }
}

export default RightSidebar;
