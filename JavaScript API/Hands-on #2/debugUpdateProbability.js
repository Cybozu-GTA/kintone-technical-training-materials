(function() {
  'use strict';

  var handler = function(event) {
    console.log(event);
    debugger;
    // Add operation here
    return event;
  };

  kintone.events.on([
    'app.record.create.submit',
    'app.record.edit.submit',
    'app.record.index.edit.submit'
  ], handler);

})();
