(function() {
  'use strict';

  var COMPANY_LIST_APP_ID = your_company_list_app_id;

  var handler = function(event) {
    console.log(event);
    var record = event.record;
    var companyName = record.Company_Name.value;
    var date = record.Date.value;
    return kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
      app: COMPANY_LIST_APP_ID,
      updateKey: {
        field: 'Company_Name',
        value: companyName
      },
      record: {
        Last_Contact_Date: {
          value: date
        }
      }
    }).then(function(response) {
      console.log(response);
      return event;
    }).catch(function(error) {
      console.log(error);
      var message = 'Error Occurred';
      event.error = event.error ? event.error + message : message;
      return event;
    });
  };

  kintone.events.on([
    'app.record.create.submit',
    'app.record.edit.submit',
    'app.record.index.edit.submit'
  ], handler);

})();
