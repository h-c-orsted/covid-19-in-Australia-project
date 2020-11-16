
angular.module('app', ['chart.js'])
    .controller('territoryController', function ($scope, $http) {
        let territory = this;

        // Settings for chart
        $scope.series = ["Positives", "Recovered"];
        $scope.colors = ['#dc3545', '#28a745'];
        $scope.chartData = [[], []];
        $scope.labels = [];
        //scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
        $scope.options = {
            scales: {
                yAxes: [
                    {
                        type: 'linear',
                        display: true
                        /*ticks: {
                            max: 200,
                            min: -200
                        }*/
                    }
                ]
            }
        };


        territory.state = "";
        territory.stateTitle = "";
        territory.csv = "";
        territory.data = [];
        territory.positives = []
        territory.recovered = [];

        territory.loadData = function(state) {
            // Parse CSV file from GitHub with PapaParse - download and set headers from CSV
            Papa.parse("https://raw.githubusercontent.com/M3IT/COVID-19_Data/master/Data/COVID_AU_state.csv", {
                download: true,
                header: true,
                complete: function(results) {
                    // Create empty array to hold values that
                    let data = [];
                    $scope.data = []; territory.positives = []; territory.recovered = [];
                    // Loop through data returned and push elements from this state into data array
                    for (let i=0; i<results["data"].length; i++) {
                        if (results["data"][i]["state_abbrev"] === state) {
                            data.push(results["data"][i]);
                            $scope.chartData[0].push(parseInt(results["data"][i]["positives"]));
                            $scope.chartData[1].push(parseInt(results["data"][i]["recovered"]));
                            $scope.labels.push(results["data"][i]["date"]);
                        }
                    }
                    // Bind data array to controller
                    territory.data = data;
                    console.log(territory.data);
                    $scope.chartData[0].push(territory.positives);
                    $scope.chartData[1].push(territory.recovered);

                    console.log($scope.chartData);


                    // Save title for title
                    territory.stateTitle = territory.data[0]["state"];


                    // Create two arrays for linear regression
                    let countLE = 21;   // Count last elements, 3 weeks
                    let lastX = [], lastY = [];
                    for (let i = data.length-countLE; i<data.length; i++) {
                        let positives = parseInt(data[i]["positives"]);
                        let recovered = parseInt(data[i]["recovered"]);
                        let tests = parseInt(data[i]["tests"]);

                        if (tests !== 0) {
                            // We can't divide by zero, therefore we skip zero values
                            lastX.push(i-data.length+countLE);  // Start from 0
                            lastY.push((positives-recovered)/tests);   // Infection index are calculated as (positives-recovered)/tests
                        }
                    }
                    console.log(lastX);
                    console.log(lastY);

                    territory.lr = linearRegression(lastX, lastY);
                    territory.trend = Math.round(territory.lr.slope * 1000000)/10;   // We use the slope (hældningskoefficient) as the trend for infection index
                    console.log(territory.lr);

                    // Update scope as this function was done async and without binding
                    $scope.$apply();
                }
            });
        }

        territory.loadTerritory = function() {
            // Get the query parameter from URL (s = state)
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);

            // Bind current state to controller
            territory.state = urlParams.get("s");

            // Call a load data with the state
            territory.loadData(territory.state);
        }

        // A promise is a function loaded when the controller is initialised (which is on page load)
        let promise = territory.loadTerritory();





        // A function to get the trend in spread of the virus
        function linearRegression(x, y) {
            let lr = {};
            let n = y.length;
            let sum_x = 0;
            let sum_y = 0;
            let sum_xy = 0;
            let sum_xx = 0;
            let sum_yy = 0;

            for (let i = 0; i < y.length; i++) {
                sum_x += x[i];
                sum_y += y[i];
                sum_xy += (x[i]*y[i]);
                sum_xx += (x[i]*x[i]);
                sum_yy += (y[i]*y[i]);
            }

            lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
            lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
            lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);

            return lr;
        }

    });