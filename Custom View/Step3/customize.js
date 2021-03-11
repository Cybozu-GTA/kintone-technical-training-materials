/* eslint-disable vars-on-top */
(function() {
  'use strict';

  // constant values for app and custom view
  var BUDGET_APP_ID = your_budget_app_id;
  var CUSTOM_VIEW_ID = your_sales_deals_app_custom_view_id;

  // constant values for this customization
  var MAX_READ_LIMIT = 100;

  var DateTime = luxon.DateTime; // Luxon: date & time wrapper https://moment.github.io/luxon/docs/manual/tour.html
  var client = new KintoneRestAPIClient({}); // Kintone REST API client https://github.com/kintone/js-sdk/tree/master/packages/rest-api-client

  /**
   * Get all users via User API
   * https://developer.kintone.io/hc/en-us/articles/115008421668
   * @param {Object} params - object argument
   *   - {Number} [limit] - size
   *   - {Number} [offset=0] - offset
   *   - {Array} [ids=[]] - ids
   *   - {Array} [codes=[]] - code
   * @return {Object} object return
   *   - {Array} users - users
   */
  var getUsers = function(params) {
    // eslint-disable-next-line no-param-reassign
    params = params || {};
    var limit = params.limit;
    var offset = params.offset;
    var ids = params.ids;
    var codes = params.codes;
    var data = params.data;

    var willBeDone = false;
    var limitThisTime = MAX_READ_LIMIT;

    if (!data) {
      data = {users: []};
    }

    if (limit === undefined) {
      limit = -1;
    }
    if (offset === undefined) {
      offset = 0;
    }
    if (limit === 0) {
      return kintone.Promise.resolve([]);
    }

    if (limit > 0) {
      if (limitThisTime > limit) {
        limitThisTime = limit;
        willBeDone = true;
      }
    }

    var body = {
      offset: offset,
      size: limitThisTime
    };
    if (params.ids) {
      body.ids = ids;
    }
    if (params.codes) {
      body.codes = codes;
    }

    return kintone.api(kintone.api.url('/v1/users', false), 'GET', body).then(function(response) {
      var length = response.users.length;
      data.users = data.users.concat(response.users.filter(function(user) {
        return user.valid;
      }));
      if (limit > 0 && limit <= length) {
        willBeDone = true;
      }
      if (response.users.length < limitThisTime || willBeDone) {
        return data.users;
      }
      return getUsers({
        limit: limit - length,
        offset: offset + length,
        ids: ids,
        codes: codes,
        data: data
      });
    });
  };

  /**
   * Build aggregation data
   * @param {Object} params - object argument
   *  - year {Number} fiscal year
   * @return {Object} aggregation data per user
   */
  var buildData = function(params) {
    var year = params.year;
    var start = DateTime.local().set({year: year}).startOf('year').toISODate(); // 2021-01-01 ISO8601 format
    var end = DateTime.local().set({year: year}).endOf('year').toISODate();     // 2021-12-31 ISO8601 format

    // build query condition
    // https://developer.kintone.io/hc/en-us/articles/360019245194
    var salesCondition = 'Expected_Close_Date >= "' + start + '" and Expected_Close_Date <= "' + end + '"';
    // -> Expected_Close_Date >= "2021-01-01" and Expected_Close_Date <= "2021-12-31"
    var targetCondition = 'Date >= "' + start + '" and Date <= "' + end + '"';
    // -> Date >= "2021-01-01" and Date <= "2021-12-31"

    return kintone.Promise.all([
      getUsers(),
      client.record.getAllRecordsWithId({
        app: kintone.app.getId(),
        condition: salesCondition
      }),
      client.record.getAllRecordsWithId({
        app: BUDGET_APP_ID,
        condition: targetCondition
      })
    ]).then(function(response) {
      var users = response[0];
      var salesRecords = response[1];
      var targetRecords = response[2];

      var data = {};
      users.forEach(function(user) {
        user.forecasts = Array(12).fill(0);
        user.targets = Array(12).fill(0);
        data[user.code] = user;
      });

      salesRecords.forEach(function(record) {
        var user = record.Rep.value[0].code;
        var month = record.Expected_Close_Date.value.split('-')[1]; // 01 <- 2021-01-31
        month = Number(month);
        data[user].forecasts[month - 1] += Number(record.Forecast_Value.value) || 0;
      });

      targetRecords.forEach(function(record) {
        var user = record.Rep.value[0].code;
        var month = record.Date.value.split('-')[1];
        month = Number(month);
        data[user].targets[month - 1] += Number(record.Target.value) || 0;
      });
      return data;
    });
  };

  /**
   * Create HTML for table with HTML template engine
   * @param {Object} params - object argument
   *  - data {Object} aggregation data
   * @return {String} compiled HTML
   */
  var createTableHTML = function(params) {
    var data = params.data;
    var colTitles = [];
    for (var i = 0; i < 12; i++) {
      colTitles.push(luxon.Info.months('short')[i]); // https://moment.github.io/luxon/docs/class/src/info.js~Info.html
    }

    // https://lodash.com/docs/4.17.15#template
    var templateString =
      '<table class="kintoneplugin-table">' +
      // thead part
      '  <thead>' +
      '    <tr>' +
      '      <th class="kintoneplugin-table-th"><span class="title">Rep</span></th>' +
      '      <th class="kintoneplugin-table-th"><span class="title"></span></th>' +
      '      <% colTitles.forEach(function(title) { %>' +
      '        <th class="kintoneplugin-table-th title"><span class="title"><%- title %></span></th>' +
      '      <% }); %>' +
      '    </tr>' +
      '  </thead>' +
      // tbody part
      '  <tbody>' +
      '    <% Object.keys(data).forEach(function(user) { %>' +
      '      <tr>' +
      '        <td rowspan="2">' +
      '          <div class="kintoneplugin-table-td-control">' +
      '            <div class="kintoneplugin-table-td-control-value">' +
      '              <div class="kintoneplugin-input-outer">' +
      '                <%- data[user].name %>' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '        </td>' +
      '        <td>' +
      '          <div class="kintoneplugin-table-td-control">' +
      '            <div class="kintoneplugin-table-td-control-value">' +
      '              <div class="kintoneplugin-input-outer">' +
      '                Actual/Forecast' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '        </td>' +
      '        <% colTitles.forEach(function(title, i) { %>' +
      '          <td>' +
      '            <div class="kintoneplugin-table-td-control">' +
      '              <div class="kintoneplugin-table-td-control-value value">' +
      '                <div class="kintoneplugin-input-outer">' +
      '                  <%- data[user].forecasts[i].toLocaleString() %>' +
      '                </div>' +
      '              </div>' +
      '            </div>' +
      '          </td>' +
      '        <% }); %>' +
      '      </tr>' +
      '      <tr>' +
      '        <td>' +
      '          <div class="kintoneplugin-table-td-control">' +
      '            <div class="kintoneplugin-table-td-control-value">' +
      '              <div class="kintoneplugin-input-outer">' +
      '                Variance' +
      '              </div>' +
      '            </div>' +
      '          </div>' +
      '        </td>' +
      '        <% colTitles.forEach(function(title, i) { %>' +
      '          <td>' +
      '            <div class="kintoneplugin-table-td-control">' +
      '              <div class="kintoneplugin-table-td-control-value value">' +
      '                <div class="kintoneplugin-input-outer">' +
      '                  <%- (data[user].forecasts[i] - data[user].targets[i]).toLocaleString() %>' +
      '                </div>' +
      '              </div>' +
      '            </div>' +
      '          </td>' +
      '        <% }); %>' +
      '      </tr>' +
      '    <% }); %>' +
      '  </tbody>' +
      '</table>';
    return _.template(templateString)({data: data, colTitles: colTitles});
  };

  /**
   * Render table
   * @param {Object} params - object argument
   *  - year {String} fiscal year
   */
  var renderTable = function(params) {
    var year = params.year;

    var containerElement = document.querySelector('#container');
    return buildData({
      year: year
    }).then(function(data) {
      containerElement.innerHTML = createTableHTML({data: data}); // insert HTML to containerElement (div#container)
      return data;
    });
  };

  /**
   * Create HTML for dropdown with HTML template engine
   * @return {String} compiled HTML
   */
  var createDropdownHTML = function() {
    var templateString =
      '<div class="kintoneplugin-select-outer">' +
      '  <div class="kintoneplugin-select">' +
      '    <select id="fy">' +
      '      <% options.forEach(function(option) { %>' +
      '        <option value="<%- option.year %>" <%- option.selected %>>FY<%- option.year %></option>' +
      '      <% }); %>' +
      '    </select>' +
      '  </div>' +
      '</div>';
    var now = DateTime.local();
    var options = [];
    for (var i = -2; i <= 1; i++) { // 4 years choices
      options.push({
        selected: i === 0 ? 'selected' : '', // it is this year when i equals 0
        year: now.year + i
      });
    }
    return _.template(templateString)({options: options});
  };

  /**
   * Render dropdown
   */
  var renderDropdown = function() {
    // https://developer.kintone.io/hc/en-us/articles/213148937/#getHeaderMenuSpaceElement
    var divElement = document.createElement('div');
    kintone.app.getHeaderMenuSpaceElement().appendChild(divElement);
    divElement.innerHTML = createDropdownHTML(); // insert HTML to header menu space element
    var selectElement = document.querySelector('#fy');

    var year;

    // attach change event for select element
    selectElement.addEventListener('change', function(event) {
      year = event.target.value;
      renderTable({
        year: year
      }).catch(function(error) {
        console.log(error);
        alert('Error Occurred.');
      });
    }, false);

    // initial rendering
    year = selectElement.value;
    return renderTable({
      year: year
    });
  };

  /**
   * Event handler for app.record.index.show
   * @param {Object} event - kintone event object
   */
  var indexHandler = function(event) {
    if (event.viewId !== CUSTOM_VIEW_ID) {
      return event;
    }
    return renderDropdown().then(function(response) {
      console.log(response);
      return event;
    }).catch(function(error) {
      alert('Error Occurred.');
      console.log(error);
      return event;
    });
  };

  // Attach app.record.index.show event
  kintone.events.on('app.record.index.show', indexHandler);
})();
