(function() {
  'use strict';

  var handler = function(event) {
    var record = event.record;
    var salesStage = record.Sales_Stage.value;
    var probability = Number(record.Probability.value);
    var newProbability = null;
    if (salesStage === 'Closed-Lost') {
      newProbability = 0;
    } else if (salesStage === 'Closed-Won' || salesStage === 'Contract') {
      newProbability = 100;
    }
    if (
      newProbability !== null &&
      newProbability !== probability &&
      confirm('Update Probability: ' + newProbability + '% since Sales Stage is "' + salesStage + '"?')
    ) {
      record.Probability.value = newProbability;
    }
    console.log(event);
    debugger;
    return event;
  };

  kintone.events.on([
    'app.record.create.submit',
    'app.record.edit.submit',
    'app.record.index.edit.submit'
  ], handler);

})();
