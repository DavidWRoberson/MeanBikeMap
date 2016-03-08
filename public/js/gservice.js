// Creates the gservice factory. This will be the primary means by which we interact with Google Maps
angular.module('gservice', [])
    .factory('gservice', function($rootScope, $http){

        // Initialize Variables
        // -------------------------------------------------------------
        // Service our factory will return
        var googleMapService = {};
        googleMapService.clickLat  = 0;
        googleMapService.clickLong = 0;

        // Array of locations obtained from API calls
        var locations = [];

        // Variables we'll use to help us pan to the right spot
        var lastMarker;
        var currentSelectedMarker;

        // User Selected Location (initialize to center of America)
        var selectedLat = 39.50;
        var selectedLong = -98.35;

        // Functions
        // --------------------------------------------------------------
        // Refresh the Map with new data. Takes three parameters (lat, long, and filtering results)
        googleMapService.refresh = function(latitude, longitude, filteredResults){

            // Clears the holding array of locations
            locations = [];

            // Set the selected lat and long equal to the ones provided on the refresh() call
            selectedLat = latitude;
            selectedLong = longitude;

            // If filtered results are provided in the refresh() call...
            if (filteredResults){

                // Then convert the filtered results into map points.
                locations = convertToMapPoints(filteredResults);

                // Then, initialize the map -- noting that a filter was used (to mark icons yellow)
                initialize(latitude, longitude, true);
            }

            // If no filter is provided in the refresh() call...
            else {

                // Perform an AJAX call to get all of the records in the db.
                $http.get('/users').success(function(response){

                    // Then convert the results into map points
                    locations = convertToMapPoints(response);

                    // Then initialize the map -- noting that no filter was used.
                    initialize(latitude, longitude, false);
                }).error(function(){});
            }
        };

        // Private Inner Functions
        // --------------------------------------------------------------

        // Convert a JSON of users into map points
        var convertToMapPoints = function(response){

            // Clear the locations holder
            var locations = [];

            // Loop through all of the JSON entries provided in the response
            for(var i= 0; i < response.length; i++) {
                var user = response[i];

                // Create popup windows for each record
                var  contentString = '<p><b>Name</b>: ' + user.username + '<br><b>Route</b>: ' + user.route + '<br>' +
                    '<b>Location Type</b>: ' + user.location_type+ '<br><b>Description</b>: ' + user.description + '</p>';

                // Converts each of the JSON records into Google Maps Location format (Note Lat, Lng format).
                locations.push(new Location(
                    new google.maps.LatLng(user.location[1], user.location[0]),
                    new google.maps.InfoWindow({
                        content: contentString,
                        maxWidth: 320
                    }),
                    user.username,
                    user.route,
                    user.location_type,
                    user.description
                ))
            }
            // location is now an array populated with records in Google Maps format
            return locations;
        };

        // Constructor for generic location
        var Location = function(latlon, message, username, route, location_type, description){
            this.latlon = latlon;
            this.message = message;
            this.username = username;
            this.route = route;
            this.location_type = location_type;
            this.description = description
        };

        // Initializes the map
        var initialize = function(latitude, longitude, filter) {

            // Uses the selected lat, long as starting point
            var myLatLng = {lat: selectedLat, lng: selectedLong};

            // If map has not been created...
            if (!map){

                // Create a new map and place in the index.html page
                var map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 3,
                    center: myLatLng
                });
            }

            // If a filter was used set the icons yellow, otherwise blue
            if(filter){
                icon = "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
            }
            else{
                icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
            }

            // Loop through each location in the array and place a marker
            locations.forEach(function(n, i){
               var marker = new google.maps.Marker({
                   position: n.latlon,
                   map: map,
                   title: "Bike Tours",
                   icon: icon,
               });

                // For each marker created, add a listener that checks for clicks
                google.maps.event.addListener(marker, 'click', function(e){

                    // When clicked, open the selected marker's message
                    currentSelectedMarker = n;
                    n.message.open(map, marker);
                });
            });

            // Set initial location as a bouncing red marker
            var initialLocation = new google.maps.LatLng(latitude, longitude);
            var marker = new google.maps.Marker({
                position: initialLocation,
                animation: google.maps.Animation.BOUNCE,
                map: map,
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            lastMarker = marker;

            // Function for moving to a selected location
            map.panTo(new google.maps.LatLng(latitude, longitude));

            //TransAm Overlay
            var transAmCoordinates = [
                {lat: 37.25, lng: -76.5},
                {lat: 37.3,  lng: -76.6},
                {lat: 37.34, lng: -77.1},
                {lat: 38,    lng:-77.84 },
                {lat: 37.75, lng: -78.1 },
                {lat: 37.9,  lng: -78.5},
                {lat: 38.1,  lng: -78.6},
                {lat: 37.9,  lng: -79.2},
                {lat: 37.4,  lng: -80.1},
                {lat: 36.6,  lng: -81.7},
                {lat: 37.6,  lng: -84.3},
                {lat: 37.37, lng: -85.2},
                {lat: 38.2,  lng: -104.6},
                {lat: 41.8,  lng: -107.2},
                {lat: 43.8,  lng: -110.5},
                {lat: 46.87, lng: -113.994},
                {lat: 44.77, lng: -117.817},
                {lat: 44.3,  lng: -121.5},
                {lat: 44,    lng: -123},
                {lat: 43.96, lng: -124.1}
                ];
                var transAm = new google.maps.Polyline({
                path: transAmCoordinates,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            transAm.setMap(map);//End TransAm Overlay

            //AtlanticCoast Overlay
            var atlanticCoastCoordinates = [
                {lat: 24.6, lng: -81.76},
                {lat: 24.64, lng: -81.3},
                {lat: 25.1, lng: -80.4},
                {lat: 25.8, lng: -80.2},
                {lat: 30.3, lng: -81.7},
                {lat: 32.4, lng: -81.8},
                {lat: 33.2, lng: -80.3},
                {lat: 33.9, lng: -79.1},
                {lat: 34.8, lng: -77.5},
                {lat: 37.1, lng: -76.6},
                {lat: 38.3, lng: -77.5},
                {lat: 39.6, lng: -76.4},
                {lat: 40.1, lng: -76.5},
                {lat: 40,   lng: -75.2},
                {lat: 41,   lng: -75.2},
                {lat: 41.7, lng: -73.9},
                {lat: 41.9, lng: -72.6},
                {lat: 41.9, lng: -71.8},
                {lat: 42.3, lng: -71.7},
                {lat: 42.7, lng: -71.4},
                {lat: 42.9, lng: -71.3},
                {lat: 43.1, lng: -70.8},
                {lat: 43.4, lng: -70.5},
                {lat: 43.8, lng: -70.5},
                {lat: 43.9, lng: -69.8},
                {lat: 44.2, lng: -69.1},
                {lat: 44.6, lng: -68.8},
                {lat: 44.4, lng: -68.2}
                ];
                var atlanticCoast = new google.maps.Polyline({
                path: atlanticCoastCoordinates,
                geodesic: true,
                strokeColor: '#e5e600',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            atlanticCoast.setMap(map);//End AtlanticCoast Overlay

              //PacificCoast Overlay
            var pacificCoastCoordinates = [
                {lat: 32.5, lng: -117},
                {lat: 33.7, lng: -118.2},
                {lat: 34.4, lng: -119.6},
                {lat: 35.4, lng: -120.7},
                {lat: 37,   lng: -121.97},
                {lat: 39.6, lng: -123.6},
                {lat: 41.1, lng: -124.1},
                {lat: 41.75,lng: -124.1},
                {lat: 43.4, lng: -124.17},
                {lat: 44.6, lng: -124},
                {lat: 46.1, lng: -123.86},
                {lat: 46.1, lng: -122.9},
                {lat: 46.9, lng: -123},
                {lat: 47.7, lng: -122.5},
                {lat: 48.53,lng: -122.4},
                {lat: 49.2, lng: -123.1}
               ];
                var pacificCoast = new google.maps.Polyline({
                path: pacificCoastCoordinates,
                geodesic: true,
                strokeColor: '#00b300',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            pacificCoast.setMap(map);//End pacificCoast Overlay

               //Great Divide Overlay
            var greatDivideCoordinates = [
                {lat: 31.3,   lng: -108.5},
                {lat: 31.9,  lng: -108.3},
                {lat: 32.55, lng: -108.4},
                {lat: 33.2,  lng: -108.3},
                {lat: 32.85, lng: -107.9},
                {lat: 33.2,  lng: -107.9},
                {lat: 33.5,  lng: -108.1},
                {lat: 36,    lng: -106.95},
                {lat: 37.4,  lng: -106.4},
                {lat: 38.4,  lng: -106.4},
                {lat: 41,    lng: -107},
                {lat: 41.8,  lng: -107.2},
                {lat: 42.5,  lng: -108.8},
                {lat: 42.9,  lng: -110},
                {lat: 45.2,  lng: -112.9},
                {lat: 46.6,  lng: -112.01},
                {lat: 47.2,  lng: -113.5},
                {lat: 48.2,  lng: -114.3},
                {lat: 48.8,  lng: -114.6},
                {lat: 48.9,  lng: -115},
                {lat: 51.15, lng: -115.5}
               ];
                var greatDivide = new google.maps.Polyline({
                path: greatDivideCoordinates,
                geodesic: true,
                strokeColor: '#6600cc',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            greatDivide.setMap(map);//End greatDivide Overlay

            //       //Northern Tier Overlay
            // var northernTierCoordinates = [
            //     {lat: 44.4, lng: -68.2},
            //     {lat: 44.6, lng: -68.8},
            //     {lat: 44.2, lng: -69.1},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:},
            //     // {lat:, lng:}
            //    ];
            //     var northernTier = new google.maps.Polyline({
            //     path: northernTierCoordinates,
            //     geodesic: true,
            //     strokeColor: '#F781BE',
            //     strokeOpacity: 1.0,
            //     strokeWeight: 2
            // });

            // northernTier.setMap(map);//End Northern Tier Overlay



            // Clicking on the Map moves the bouncing red marker
            google.maps.event.addListener(map, 'click', function(e){
                var marker = new google.maps.Marker({
                    position: e.latLng,
                    animation: google.maps.Animation.BOUNCE,
                    map: map,
                    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                });

                // When a new spot is selected, delete the old red bouncing marker
                if(lastMarker){
                    lastMarker.setMap(null);
                }

                // Create a new red bouncing marker and move to it
                lastMarker = marker;
                map.panTo(marker.position);

                // Update Broadcasted Variable (lets the panels know to change their lat, long values)
                googleMapService.clickLat = marker.getPosition().lat();
                googleMapService.clickLong = marker.getPosition().lng();
                $rootScope.$broadcast("clicked");
            });
        };

        // Refresh the page upon window load. Use the initial latitude and longitude
        google.maps.event.addDomListener(window, 'load',
            googleMapService.refresh(selectedLat, selectedLong));

        return googleMapService;
    });

