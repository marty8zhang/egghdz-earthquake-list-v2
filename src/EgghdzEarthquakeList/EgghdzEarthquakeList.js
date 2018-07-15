import React, { Component } from 'react';
import EarthquakeMap from './EarthquakeMap';
import RightSidebar from './RightSidebar/RightSidebar';
import ScrollDownButton from './ScrollDownButton';
import AnimatedLoader from './FullPageLoader';
import animateScrollTo from 'animated-scroll-to';
import {getViewportSize} from './Helpers/getViewportSize.js';
import './EgghdzEarthquakeList.css';

class EgghdzEarthquakeList extends Component {
  constructor(props) {
    super(props);

    this.state = {
      viewport: {},
      notificationMessage: '',
      notificationType: '',
      settingsFormSubmittedTime: window.moment().valueOf(), // The unix timestamp (in milliseconds) when the map settings were initialised/submitted.
      timezoneFieldValue: window.moment.tz.guess(),
      localeFieldValue: 'en-au',
      locationFieldValue: '',
      radiusFieldValue: 0,
      radiusFieldText: 'worldwide',
      feedFieldValue: 'all_day.geojson',
      feedFieldText: 'in the past day',
      earthquakeDetailsContent: '',
      isAnimatedLoaderVisible: true,
      animatedLoaderMessage: 'Initialising...',
    };

    this.handleSettingsFormFieldChange = this.handleSettingsFormFieldChange.bind(this);
    this.handleSettingsFormSubmit = this.handleSettingsFormSubmit.bind(this);
    this.handleScrollDownButtonClick = this.handleScrollDownButtonClick.bind(this);
    this.setLocationFieldValue = this.setLocationFieldValue.bind(this);
    this.setEarthquakeDetailsContent = this.setEarthquakeDetailsContent.bind(this);
    this.setNotification = this.setNotification.bind(this);
    this.setAnimatedLoaderVisibility = this.setAnimatedLoaderVisibility.bind(this);
    this.setAnimatedLoaderMessage = this.setAnimatedLoaderMessage.bind(this);
    this.setViewport = this.setViewport.bind(this);

    /*
     * Development Notes:
     *   # moment-timezone related features (tz.setDefault() in the below case) must be called before locale().
     *   # Even though moment.js acts as the default timezone was set to the returned value of tz.guess(), you'll still need to set the default timezone explicitly; otherwise, tz() will returned as 'undefined'.
     */
    window.moment.tz.setDefault(this.state.timezoneFieldValue).locale(this.state.localeFieldValue); // Set the default timezone & locale.
  }

  componentDidMount() {
    this.setViewport();

    window.addEventListener('resize', this.setViewport);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setViewport);
  }

  handleSettingsFormFieldChange(event) {
    const target = event.target;
    const name = target.name + 'FieldValue';
    let stateObject;
    let value;

    if (target.type === 'checkbox') {
      value = target.checked;
    } else if (target.type === 'select-multiple') {
      // target.options here is an object with option object(s) as its properties. The [...obj] syntax extracts the properties of obj and put them into an array.
      value = [...target.options].filter((option) => {
        return option.selected;
      })
      .map((option) => {
        return option.value;
      });
    } else {
      value = target.value;
    }

    stateObject = {
      [name]: value
    };

    if (name === 'radiusFieldValue') {
      stateObject.radiusFieldText = target.options[target.selectedIndex].text.toLowerCase();
    } else if (name === 'feedFieldValue') {
      stateObject.feedFieldText = target.options[target.selectedIndex].text.toLowerCase();
    }

    this.setState(stateObject);
  }

  // To-do: Don't update the state if nothing has changed.
  handleSettingsFormSubmit(event) {
    event.preventDefault();

    animateScrollTo(0); // Back to top.
    this.setEarthquakeDetailsContent(''); // Clear the content of the earthquake details panel (if any).

    window.moment.tz.setDefault(this.state.timezoneFieldValue).locale(this.state.localeFieldValue); // Update the timezone & locale.

    this.setState({
      settingsFormSubmittedTime: window.moment().valueOf()
    });
  }

  handleScrollDownButtonClick(event) {
    const scrollTarget = document.getElementById('right-sidebar');

    event.preventDefault();

    if (scrollTarget !== null) {
      animateScrollTo(scrollTarget);
    }
  }

  setViewport() {
    this.setState({
      viewport: getViewportSize()
    });
  }

  setNotification(message, type = 'danger') {
    this.setState({
      notificationMessage: message,
      notificationType: type
    });
  }

  setLocationFieldValue(value) {
    this.setState({
      locationFieldValue: value
    });
  }

  setEarthquakeDetailsContent(content) {
    this.setState({
      earthquakeDetailsContent: content
    });
  }

  setAnimatedLoaderVisibility(isVisible = false) {
    this.setState({
      isAnimatedLoaderVisible: isVisible
    });
  }

  setAnimatedLoaderMessage(message) {
    this.setState({
      animatedLoaderMessage: message
    });
  }

  render() {
    return (
      <React.Fragment>
        <div className="container-fluid container-full-height">
          <div className="row">
            <EarthquakeMap
              viewport={this.state.viewport}
              settingsChangedTime={this.state.settingsFormSubmittedTime}
              location={this.state.locationFieldValue}
              radius={this.state.radiusFieldValue}
              radiusText={this.state.radiusFieldText}
              feed={this.state.feedFieldValue}
              feedText={this.state.feedFieldText}
              setNotification={this.setNotification}
              setLocation={this.setLocationFieldValue}
              setEarthquakeDetailsContent={this.setEarthquakeDetailsContent}
              setLoaderVisibility={this.setAnimatedLoaderVisibility}
              setLoaderMessage={this.setAnimatedLoaderMessage} />
            <RightSidebar
              message={this.state.notificationMessage}
              messageType={this.state.notificationType}
              timezone={this.state.timezoneFieldValue}
              locale={this.state.localeFieldValue}
              location={this.state.locationFieldValue}
              radius={this.state.radiusFieldValue}
              feed={this.state.feedFieldValue}
              earthquakeDetails={this.state.earthquakeDetailsContent}
              handleSettingsFormFieldChange={this.handleSettingsFormFieldChange}
              handleSettingsFormSubmit={this.handleSettingsFormSubmit} />
          </div>
        </div>
        <ScrollDownButton handleClick={this.handleScrollDownButtonClick} />
        {this.state.isAnimatedLoaderVisible &&
          <AnimatedLoader message={this.state.animatedLoaderMessage} />
        }
      </React.Fragment>
    );
  }
}

export default EgghdzEarthquakeList;
