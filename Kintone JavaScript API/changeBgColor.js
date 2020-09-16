(function() {
  'use strict';

  var changeSalesStageFieldColor = function(params) {
    var element = params.element;
    var value = params.value;
    var backgroundColor;
    var fontWeight;
    switch (value) {
    case 'Qualification':
      backgroundColor = '#FED101';
      break;
    case 'Evaluation':
      backgroundColor = '#BFFF50';
      break;
    case 'Negotiation':
      backgroundColor = '#34FFF5';
      break;
    case 'Closed-Won':
    case 'Contract':
      backgroundColor = '#F9B1FB';
      fontWeight = 'bold';
      break;
    case 'Closed-Lost':
      backgroundColor = 'rgb(198,195,195)';
      break;
    default:
      break;
    }

    if (backgroundColor) {
      element.style.backgroundColor = backgroundColor;
    }
    if (fontWeight) {
      element.style.fontWeight = fontWeight;
    }
  };

  kintone.events.on('app.record.detail.show', function(event) {
    var record = event.record;
    var value = record.Sales_Stage.value;
    var element = kintone.app.record.getFieldElement('Sales_Stage');
    changeSalesStageFieldColor({element: element, value: value});
    return event;
  });

  kintone.events.on('app.record.index.show', function(event) {
    var records = event.records;
    var elements = kintone.app.getFieldElements('Sales_Stage');
    for (var i = 0; i < records.length; i++) {
      var value = record.Sales_Stage.value;
      var element = elements[i];
      changeSalesStageFieldColor({element: element, value: value});
    }
    return event;
  });

})();
