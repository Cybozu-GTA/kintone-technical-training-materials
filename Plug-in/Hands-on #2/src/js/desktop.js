((PLUGIN_ID) => {
  'use strict';

  const config = kintone.plugin.app.getConfig(PLUGIN_ID);
  const loginUserCode = kintone.getLoginUser().code;

  // Change the background color
  const changeUserSelectionFieldColor = (element) => {
    if (element) {
      element.style.backgroundColor = config.bgColor;
    }
  };

  kintone.events.on('app.record.detail.show', (event) => {
    const record = event.record;
    const userEl = kintone.app.record.getFieldElement(config.fieldSelection);
    if (!userEl) {
      return event;
    }
    const users = record[config.fieldSelection].value;
    const userList = users.map((user) => {
      return user.code;
    });
    if (userList.includes(loginUserCode)) {
      changeUserSelectionFieldColor(userEl);
    }
    return event;
  });

  kintone.events.on('app.record.index.show', (event) => {
    if (!event.size) {
      return event;
    }
    const userEls = kintone.app.getFieldElements(config.fieldSelection);
    if (!userEls) {
      return event;
    }
    event.records.forEach((record, i) => {
      const users = record[config.fieldSelection].value;
      const userList = users.map((user) => {
        return user.code;
      });
      if (userList.includes(loginUserCode)) {
        const userEl = userEls[i];
        changeUserSelectionFieldColor(userEl);
      }
    });
    return event;
  });

})(kintone.$PLUGIN_ID);
