import React, { Component } from 'react';
import animateScrollTo from 'animated-scroll-to';

class SettingsForm extends Component {
  constructor(props) {
    super(props);

    this.handleBackToMapButtonClick = this.handleBackToMapButtonClick.bind(this);
  }

  handleBackToMapButtonClick(event) {
    event.preventDefault();

    animateScrollTo(0);
  }

  render() {
    const timezoneOptions = window.moment.tz.names().map((tz) => (
      <option value={tz} key={tz}>{tz}</option>
    ));
    const currentTimezone = typeof this.props.timezone === 'undefined' ? window.moment.tz.guess() : this.props.timezone;
    const localeOptions = window.moment.locales().map((lc) => (
      <option value={lc} key={lc}>{lc}</option>
    ));
    const currentLocale = typeof this.props.locale === 'undefined' ? 'en-au' : this.props.locale;

    return (
      <form id="settings-form" onSubmit={this.props.handleSubmit}>
        <div className="form-group">
          <label htmlFor="field-timezone">Timezone:</label>
          <select id="field-timezone" name="timezone" value={currentTimezone} onChange={this.props.handleFieldChange} className="form-control">
            {timezoneOptions}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="field-locale">Locale:</label>
          <select id="field-locale" name="locale" value={currentLocale} onChange={this.props.handleFieldChange} className="form-control">
            {localeOptions}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="field-location">My Location: <small>(blue dot)</small></label>
          <input id="field-location" name="location" value={this.props.location} onChange={this.props.handleFieldChange} className="form-control" placeholder="Your address, coordinate, or leave blank for auto detection." />
          <div className="text-warning mt8"><strong>Note:</strong> Please allow the browser to access your location for auto detection to work.</div>
        </div>
        <div className="form-group">
          <label htmlFor="field-radius">Show Earthquakes:</label>
          <select id="field-radius" name="radius" value={this.props.radius} onChange={this.props.handleFieldChange} className="form-control">
            <option value="0">Worldwide</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="200">Within 200 km</option>
            <option value="500">Within 500 km</option>
            <option value="1000">Within 1000 km</option>
            <option value="2000">Within 2000 km</option>
            <option value="5000">Within 5000 km</option>
            <option value="10000">Within 10000 km</option>
          </select>
          <select id="field-feed" name="feed" value={this.props.feed} onChange={this.props.handleFieldChange} className="form-control mt8">
            <option value="significant_hour.geojson">in the Past Hour (Significant)</option>
            <option value="all_hour.geojson">in the Past Hour</option>
            <option value="significant_day.geojson">in the Past Day (Significant)</option>
            <option value="all_day.geojson">in the Past Day</option>
            <option value="significant_week.geojson">in the Past 7 Days (Significant)</option>
            <option value="all_week.geojson">in the Past 7 Days</option>
            <option value="significant_month.geojson">in the Past 30 Days (Significant)</option>
            <option value="all_month.geojson">in the Past 30 Days</option>
          </select>
          <p className="mt8"><a href="https://earthquake.usgs.gov/earthquakes/browse/significant.php#sigdef" target="_blank" rel="noopener noreferrer">What makes an earthquake "significant"? (USGS Earthquake Hazards Program)</a></p>
        </div>
        <div className="buttons">
          <button id="btn-update-map" className="btn btn-primary" type="submit">Update Map</button>
          <button id="btn-back-to-map" className="btn btn-default" onClick={this.handleBackToMapButtonClick}>Back to Map</button>
        </div>
      </form>
    );
  }
}

export default SettingsForm;
