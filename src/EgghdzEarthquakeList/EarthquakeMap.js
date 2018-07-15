import React, { Component } from 'react';
import axios from 'axios';
// import GoogleMapsAPI from '@google/maps';
// import GoogleMarkerClusterer from '@google/markerclusterer';
import animateScrollTo from 'animated-scroll-to';

/**
 * Class representing the EarthquakeMap React component.
 * @extends React.Component
 */
class EarthquakeMap extends Component {
  /**
   * Create a EarthquakeMap component.
   * param {Object} props
   */
  constructor(props) {
    super(props);

    // Declare (and initialise some of) the properties needed for this component.
    this.googleMapsAPI = null;
    this.defaultMapZoom = 2;
    // In the middle of Australia.
    this.defaultMapCenter = {
      lat: -25,
      lng: 134
    };
    this.mapOptions = {
      zoom: this.defaultMapZoom,
      center: this.defaultMapCenter,
      scaleControl: true,
      mapTypeControl: true,
      fullscreenControl: true,
    };
    this.map = null;
    this.infoWindowMaxWidth = 675;
    this.infoWindow = null;
    /**
     * The object used for holding references to all active event listeners registered by this class.
     * @property {Object} eventListeners
     * @property {Object} eventListeners.infoWindow Event listeners related to Google Maps InfoWindow objects.
     * @property {function[]} eventListeners.infoWindow.showDetails Event listeners of the Show Details buttons of each InfoWindow.
     * @property {function[]} eventListeners.infoWindow.setAsMyLocation Event listeners of the Set as My Location buttons of each InfoWindow.
     */
    this.eventListeners = {
      'infoWindow': {
        'showDetails': [],
        'setAsMyLocation': []
      }
    }
    this.geocoder = null;
    this.markerClusterer = null;
    this.currentLocation = null;
    this.currentLocationMarker = null;
    this.currentLocationCircle = null;
  }

  componentDidMount() {
    // Initialise the geocoder.
    this.googleMapsAPI = window.google.maps;
    this.geocoder = new this.googleMapsAPI.Geocoder();

    this.reset();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.viewport.width !== this.props.viewport.width) { // The browser window has been resized.
      const width = this.props.viewport.width;
      let infoWindowPadding = 20; // For one side, in pixels.

      if (width <= 568) {
        this.mapOptions.mapTypeControl = false;
        infoWindowPadding = 10;
      } else {
        this.mapOptions.mapTypeControl = true;
      }

      if (width < 992) {
        this.mapOptions.fullscreenControl = false;
      } else {
        this.mapOptions.fullscreenControl = true;
      }

      this.infoWindowMaxWidth = document.getElementById('earthquake-map').clientWidth - infoWindowPadding * 2 - 53; // 53px is the width that Google Maps' Info Window interface adds in.

      if (this.currentInfoWindow) {
        this.currentInfoWindow.setOptions({
          maxWidth: this.infoWindowMaxWidth,
        });
      }
      this.map.setOptions(this.mapOptions);
    }

    if (prevProps.settingsChangedTime !== this.props.settingsChangedTime) { // The settings form has been submitted.
      this.reset();
    }
  }

  /**
   * Set the visibility of the loader (if any).
   * @param {boolean} visible
   */
  setLoaderVisibility(visible) {
    if (typeof this.props.setLoaderVisibility === 'function') {
      this.props.setLoaderVisibility(visible);
    }
  }

  /**
   * Set a informative message to the loader (if any).
   * @param {string} message
   */
  setLoaderMessage(message) {
    if (typeof this.props.setLoaderMessage === 'function') {
      this.props.setLoaderMessage(message);
    }
  }

  /**
   * Set a informative message to be displayed (if there is a notification container) to the user.
   * @param {string} message
   */
  setNotification(message, type) {
    if (typeof this.props.setNotification === 'function') {
      this.props.setNotification(message, type);
    }
  }

  /**
   * Set the value of the My Location field in the form (if any).
   * @param {string} value
   */
  setLocation(value) {
    if (typeof this.props.setLocation === 'function') {
      this.props.setLocation(value);
    }
  }

  /**
   * Set the content of the earthquake details panel (if any).
   * @param {string} content
   */
  setEarthquakeDetailsContent(content) {
    if (typeof this.props.setEarthquakeDetailsContent === 'function') {
      this.props.setEarthquakeDetailsContent(content);
    }
  }

  /**
   * Initialise/reset the whole map.
   */
  reset() {

    this.setLoaderMessage('Loading Google Maps...');
    this.setLoaderVisibility(true);

    // Initialise/reset the map. Development Note: When the component is re-rendered, the old map container is removed from the DOM tree and a new one is generated. Hence, it's necessary to create a new instance of google.maps.Map.
    this.map = new this.googleMapsAPI.Map(document.getElementById('earthquake-map'), this.mapOptions);

    this.setLoaderMessage('Determining your location...');

    this.resetLocation()
        .then((value) => {
          this.setLocation(value);

          this.setLoaderMessage('Dropping your location marker...');

          return this.resetLocationMarker();
        })
        .then((value) => {
          this.setLoaderMessage('Retrieving earthquake data...');

          return this.retrieveData();
        })
        .then((value) => {
          this.setLoaderMessage('Dropping earthquake markers...');

          return this.resetMarkers(value);
        })
        .then((value) => {
          this.setLoaderMessage('Grouping earthquake markers...');

          return this.resetMarkerClusterer(value);
        })
        .then((value) => {
          const selectedRadius = typeof this.props.radius === 'undefined' ? 0 : this.props.radius;
          const radiusText = typeof this.props.radiusText === 'undefined' ? 'worldwide' : `${selectedRadius ? `${this.props.radiusText} to your location` : this.props.radiusText}`;
          const feedText = typeof this.props.feedText === 'undefined' ? 'in the Past Day' : this.props.feedText;

          this.setNotification(`${value.getTotalMarkers()}${feedText.includes('significant') ? ' significant' : ''} earthquake(s) detected ${radiusText} ${feedText.replace(' (significant)', '')}.`,
            'info');

          this.setLoaderVisibility();
        })
        .catch((error) => {
          this.setLoaderVisibility();

          this.setNotification(`${error.toString().includes('Error: ') ? '' : 'Error: '}${error}`);
        });


  }

  /**
   * Initialise/reset the user's location related things on the map based on the given (via this.props) or current (via HTML5 geolocation) location.
   * @return {Promise} A Promise object represents the result of resetting/initialising the user's location. The resolved result should be a string represents either a valid address recognised by Google Maps, or a cooridnate in the 'latitude, longitude' format.
   */
  resetLocation() {
    return new Promise((resolve, reject) => {
      const specifiedLocation = typeof this.props.location === 'undefined' ? '' : this.props.location;

      if (this.currentLocationCircle) {
        this.currentLocationCircle.setMap(null); // Remove the circle that represents the selected radius.
      }

      if (specifiedLocation) {
        const specifiedCoordinate = specifiedLocation.split(specifiedLocation.includes(', ') ? ', ' : ',');

        if (this.isValidCoordinate(specifiedCoordinate)) {
          this.currentLocation = new this.googleMapsAPI.LatLng(specifiedCoordinate[0], specifiedCoordinate[1]);

          resolve(`${specifiedCoordinate[0]}, ${specifiedCoordinate[1]}`);
        } else { // The specified location isn't a coordinate. Try to resolve it as an address using geocoder.
          this.geocoder.geocode({
            'address': specifiedLocation,
          }, function (geocoderResult, geoStatus) {
            if (geoStatus === 'OK') {
              this.currentLocation = geocoderResult[0].geometry.location;

              resolve(geocoderResult[0].formatted_address);
            } else {
              reject(`Geocode was not successful for the following reason: ${geoStatus}`);
            }
          });
        }
      } else { // No location is provided. Try to auto detect the visitor's location using HTML5 geolocation.
        if (navigator.geolocation) {
          const geolocationOptions = {
            enableHighAccuracy: true,
            timeout: 10000, // In milliseconds.
            maximumAge: 300000, // The maximum age in milliseconds of a possible cached position that is acceptable to return.
          };

          navigator.geolocation.getCurrentPosition((position) => {
            this.currentLocation = new this.googleMapsAPI.LatLng(position.coords.latitude, position.coords.longitude);

            resolve(`${position.coords.latitude}, ${position.coords.longitude}`);
          }, (error) => { // Handle errors of navigator.geolocation.getCurrentPosition().
            let message = '';

            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = "You denied the Geolocation request or the request can't be fulfilled through an insecure connection (e.g., non-HTTPS).";
                break;

              case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable for the Geolocation request.";
                break;

              case error.TIMEOUT:
                message = "The Geolocation request to get user location timed out.";
                break;

              case error.UNKNOWN_ERROR:
                message = "An unknown error occurred during the Geolocation request.";
                break;

              default:
                message = error.message;
            }

            reject(message);
          }, geolocationOptions);
        } else {
          reject(`Your browser doesn't support location auto detection.`);
        }
      }
    });
  }

  /**
   * Initialise/reset the My Location marker on the map.
   * It will also draw a circle around the marker (if there is a selected radius), re-center the map, and set the proper zoom level for the map.
   * @return {Promise} A Promise object represents the result of resetting/initialising the user's location. The resolved result should be a google.maps.Marker object represents the selected/auto-detected location by/of the user.
   */
  resetLocationMarker() {
    return new Promise((resolve, reject) => {
      const selectedRadius = typeof this.props.radius === 'undefined' ? 0 : this.props.radius;
      const markerOptions = {
        position: this.currentLocation,
        map: this.map,
        infoWindow: null, // In case there is a previous binding.
        zIndex: 2147483647, // Makes sure no other marker is on top of this one. Development Note: Marker Clusterer icons belong to a different google.maps.MapPanes object, which has a higher z-index value, hence the My Location marker might still be overlapped by one of those.
        icon: {
          path: this.googleMapsAPI.SymbolPath.CIRCLE,
          strokeWeight: 2,
          strokeColor: '#FFF',
          fillColor: '#00F',
          fillOpacity: 1,
          scale: 6,
        },
      };

      if (this.currentLocationMarker) { // There is an existing My Location marker.
        this.currentLocationMarker.setOptions(markerOptions);
      } else {
        this.currentLocationMarker = new this.googleMapsAPI.Marker(markerOptions);
      }

      if (selectedRadius) { // If there is a selected radius, draws a circle around the My location marker.
        const circleOptions = {
          map: this.map,
          center: this.currentLocation,
          radius: selectedRadius * 1000, // Development Note: The radius value should be in metres.
          strokeWeight: 1,
          fillColor: '#00F',
          fillOpacity: 0.1,
        };

        if (this.currentLocationCircle) { // There is an existing My Location circle.
          this.currentLocationCircle.setOptions(circleOptions);
        } else {
          this.currentLocationCircle = new this.googleMapsAPI.Circle(circleOptions);
        }
      }

      this.mapOptions.center = this.currentLocation;
      this.mapOptions.zoom = this.determineMapZoom(selectedRadius);
      this.map.setOptions(this.mapOptions);

      resolve(this.currentLocationMarker);
    });
  }

  /**
   * Retrieve earthquake data from a remote server.
   * @return {Promise} A Promise object represents the result of data retrieving. The resolved result should be an array of earthquake data returned by the remote server.
   */
  retrieveData() {
    // Development Note: Even though axios is Promise based, the Ajax request is still wrapped in a Promise object to make the coding style more consistent with other methods in this class.
    return new Promise((resolve, reject) => {
      const feed = typeof this.props.feed === 'undefined' ? 'all_day.geojson' : this.props.feed;

      axios.create({
            baseURL: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/'
            })
            .get(feed)
            .then((response) => {
              if (this.isRemoteDataValid(response.data)) {
                resolve(response.data.features);
              } else {
                reject(`The returned data from the server of USGS's Earthquake Hazards Program is invalid. Data:
  ${response.data}`);
              }
            })
            .catch((error) => {
              reject(`Failed to retrieve the remote earthquake data. It is most likely that the server of USGS's Earthquake Hazards Program is not available at the moment. Details:
  ${error}`);
            });
    });
  }

  /**
   * Initialise/reset an array of Google Maps Markers based on the given earthquake data.
   * @param {Object} data The earthquake data returned from the remote server.
   * @return {Promise} A Promise object represents the result of markers initialising/resetting. The resolved result should be an array of google.maps.Marker objects that each of them represents the location of an earthquake and also contains the detailed data of that earthquake.
   */
  resetMarkers(data) {
    return new Promise((resolve, reject) => {
      const selectedRadius = typeof this.props.radius === 'undefined' ? 0 : this.props.radius;
      let result = [];
      let markerIndex = 1; // The index of each visible marker.
      // Throw away existing event listeners related to InfoWindows (if any) since a new set of markers will be generated.
      this.eventListeners.infoWindow.showDetails = [];
      this.eventListeners.infoWindow.setAsMyLocation = [];

      for(let i = 0; i < data.length; i++) {
        const earthquake = data[i];
        const latLng = new this.googleMapsAPI.LatLng(earthquake.geometry.coordinates[1], earthquake.geometry.coordinates[0]);

        if (!selectedRadius || Math.ceil(this.googleMapsAPI.geometry.spherical.computeDistanceBetween(this.currentLocation, latLng) / 1000) <= selectedRadius) { // Only render markers when no radius is given or the ones within the specified radius. Development Note: computeDistanceBetween() returns a value in metres.
          const earthquakeTime = window.moment(earthquake.properties.time); // The raw value is the number of milliseconds since the epoch.

          const markerContent = `<h3 class="google-map-marker-title">${earthquake.properties.place}</h3>
<div class="google-map-marker-content">
  <p><strong>Time:</strong> ${earthquakeTime.format('LLLL Z')}</p>
  <p><strong>Latitude:</strong> ${earthquake.geometry.coordinates[1]}<br>
    <strong>Longitude:</strong> ${earthquake.geometry.coordinates[0]}<br>
    <strong>Depth:</strong> ${earthquake.geometry.coordinates[2]} km</p>
  <p><strong>Magnitude:</strong> ${earthquake.properties.mag}</p>
</div>
<div class="google-map-marker-content-more">
  <p class="buttons"><button id="show-details-${markerIndex}" class="btn btn-default">Show Details</button><button id="set-as-my-location-${markerIndex}" class="btn btn-default">Set as My Location</button></p>
</div>`;

          const infoWindow = new this.googleMapsAPI.InfoWindow({
            content: markerContent,
            maxWidth: 247,
          });
          const marker = new this.googleMapsAPI.Marker({
            position: latLng,
            map: this.map,
            infoWindow: infoWindow,
            rawData: earthquake,
          });

          this.googleMapsAPI.event.addListener(marker, 'click', this.createMarkerClickListener(marker, markerIndex));

          result.push(marker);

          markerIndex++;
        }
      }

      resolve(result);
    });
  }

  /**
   * Initialise/reset a MarkerClusterer object to manage the given markers.
   * @param {google.maps.Marker[]} markers An array of Google Maps Markers.
   * @return {Promise}  A Promise object represents the result of markers initialising/resetting. The resolved result should be a MarkerClusterer object who is responsible for grouping all visible earthquake markers.
   */
  resetMarkerClusterer(markers) {
    return new Promise((resolve, reject) => {
      if (this.markerClusterer) {
        this.markerClusterer.clearMarkers();
        // Development Note: In this solution based on React, somehow addMarkers() below won't make the marker clusterer re-draw itself; neither calling redraw() nor resetViewport() will make any difference too. This behaviour is different than the old jQuery solution. Hence, we'll need to create a new MarkerClusterer object instead, which is similar to the official example - https://htmlpreview.github.io/?https://raw.githubusercontent.com/googlemaps/v3-utility-library/master/markerclusterer/examples/advanced_example.html.
        // this.markerClusterer.addMarkers(markers);
        this.markerClusterer = new window.MarkerClusterer(this.map, markers, {
          imagePath: 'https://cdn.jsdelivr.net/npm/gmaps-marker-clusterer@1.2.2/images/m',
        });
      } else {
        this.markerClusterer = new window.MarkerClusterer(this.map, markers, {
          imagePath: 'https://cdn.jsdelivr.net/npm/gmaps-marker-clusterer@1.2.2/images/m',
        });
      }

      resolve(this.markerClusterer);
    });
  }

  /**
   * Check if a given array represents a valid coordinate.
   * @param {(number[]|string[])} coordinate An array which represents a coordinate as [latitude, longitude] in the number format. Note: Degree strings, e.g., "40° 26′ 46″ N" or "40.446° N", will be deemed as invalid.
   * @return {boolean} true if the given array represents a valid coordinate; or false otherwise.
   */
  isValidCoordinate(coordinate) {
    let result = false;

    if (coordinate && Array.isArray(coordinate) && coordinate.length === 2 && !isNaN(coordinate[0]) && coordinate[0] >= -90 && coordinate[0] <= 90 && !isNaN(coordinate[1]) && coordinate[1] >= -180 && coordinate[1] <= 180) {
      result = true;
    }

    return result;
  }

  /**
   * Determine the map zoom level based on the given radius value.
   * @param {number} radius The radius in km.
   * @return {number} The map zoom level based on the value of the selected radius or the default map zoom level set during initialisation.
   */
  determineMapZoom(radius) {
    let result = this.defaultMapZoom;
    radius = Math.round(radius);

    if (!radius || radius >= 10000) { // The radius isn't set or >= 10000 km.
      ;
    } else if (radius >= 5000) {
      result += 1;
    } else if (radius >= 2000) {
      result += 2;
    } else if (radius >= 1000) {
      result += 3;
    } else if (radius >= 500) {
      result += 4;
    } else if (radius >= 200) {
      result += 5;
    } else if (radius >= 100) {
      result += 6;
    } else if (radius >= 50) {
      result += 7;
    } else {
      result += 8;
    }

    return result;
  }

  /**
   * Check if the data returned by the server of USGS's Earthquake Hazards Program is valid.
   * @param {Object} data The data returned by the server of USGS's Earthquake Hazards Program.
   * @return {boolean} true if the data returned by the server of USGS's Earthquake Hazards Program is valid; or false otherwise.
   */
  isRemoteDataValid(data) {
    return typeof data.metadata !== 'undefined' && data.metadata.status !== 'undefined' && data.metadata.status === 200 && typeof data.features !== 'undefined' && data.features instanceof Array;
  }

  /**
   * Create a click listener for a given marker.
   * Development Notes: This main purpose of this helper method is to correctly bind click event listeners to the 'Show Details' & 'Set as My Location' buttons of each InfoWindow.
   * @param {google.maps.Marker} marker The given marker.
   * @param {integer} index The index number of the given marker among the markers on the map.
   * @return {function} The listener for the marker click event.
   */
  createMarkerClickListener(marker, index) {
    return () => {
      this.setEarthquakeDetailsContent(''); // Empty the earthquake details panel.

      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
      }
      marker.infoWindow.setOptions({
        maxWidth: this.infoWindowMaxWidth,
      });
      marker.infoWindow.open(this.map, marker);
      this.currentInfoWindow = marker.infoWindow;

      // The 'Show Details' button.
      if (typeof this.eventListeners.infoWindow.showDetails[index] !== 'function') { // There is no existing click event listener for this particular button.
        this.eventListeners.infoWindow.showDetails[index] = () => {

          this.setEarthquakeDetailsContent((
<React.Fragment>
  <h4>Earthquake Detail:</h4>
  <div className="pre">
    {JSON.stringify(marker.rawData, null, 2)}
  </div>
</React.Fragment>
          ));

          // For small screens, the details container will be on the second 'page', the button will need to scroll the page too.
          // To-do: Find a better way to determine the screen size dynamically. Getting a flag as a prop from the parent might not be ideal because resetting the map when the browser size changes isn't desirable. (TBD)
          console
          const isSmallScreen = typeof this.props.viewport !== 'undefined' && this.props.viewport.width < 992 ? true : false;
          if (isSmallScreen) {
            const scrollTarget = document.getElementById('earthquake-details');

            if (scrollTarget !== null) {
              animateScrollTo(scrollTarget);
            }
          }
        };

        document.getElementById('show-details-' + index).addEventListener('click', this.eventListeners.infoWindow.showDetails[index]);
      }

      // The 'Set as My Location' button.
      if (typeof this.eventListeners.infoWindow.setAsMyLocation[index] !== 'function') { // There is no existing click event listener for this particular button.
        this.eventListeners.infoWindow.setAsMyLocation[index] = () => {

          this.setLocation(`${marker.position.lat()}, ${marker.position.lng()}`);

          // For small screens, the settings form will be on the second 'page', the button will need to scroll the page too.
          // To-do: Find a better way to determine the screen size dynamically. Getting a flag as a prop from the parent might not be ideal because resetting the map when the browser size changes isn't desirable. (TBD)
          const isSmallScreen = typeof this.props.viewport !== 'undefined' && this.props.viewport.width < 992 ? true : false;
          if (isSmallScreen) {
            const scrollTarget = document.getElementById('settings-form');

            if (scrollTarget !== null) {
              animateScrollTo(scrollTarget);
            }
          }
        };

        document.getElementById('set-as-my-location-' + index).addEventListener('click', this.eventListeners.infoWindow.setAsMyLocation[index]);
      }
    }
  }

  render() {
    const settingsChangedTime = typeof this.props.settingsChangedTime === 'undefined' ? window.moment().valueOf() : this.props.settingsChangedTime;

    return (
      <div id="earthquake-map" className="col-md-8" key={settingsChangedTime}></div>
    );
  }
}

export default EarthquakeMap;
