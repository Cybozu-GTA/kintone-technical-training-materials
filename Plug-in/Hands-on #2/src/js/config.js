((PLUGIN_ID) => {
  'use strict';

  const client = new KintoneRestAPIClient({});

  // Get the elements
  const fieldSelection = document.getElementById('field-selection');
  const bgColor = document.getElementById('bg-color');
  const saveButton = document.getElementById('save');
  const cancelButton = document.getElementById('cancel');

  // Escape HTML
  const escapeHtml = (htmlStr) => {
    return htmlStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Set the saved data if it exists
  const setDefault = () => {
    const conf = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (conf) {
      fieldSelection.value = conf.fieldSelection;
      bgColor.value = conf.bgColor;
    }
  };

  // Set the user selection field
  const setUserSelection = () => {
    const APP_ID = kintone.app.getId();
    const params = {
      app: APP_ID,
      preview: true
    };
    return client.app.getFormFields(params).then((resp) => {
      for (const key of Object.keys(resp.properties)) {
        if (!resp.properties[key]) {
          continue;
        }
        const option = document.createElement('option');
        const prop = resp.properties[key];
        if (prop.type === 'USER_SELECT') {
          option.setAttribute('value', escapeHtml(prop.code));
          option.innerText = escapeHtml(prop.label);
          fieldSelection.appendChild(option);
        }
      }
    }).catch((error) => {
      console.log(error);
      alert('Error occurred.');
    });
  };

  // Set the input data if the save button is clicked
  saveButton.onclick = () => {
    const config = {};
    if (!fieldSelection.value || fieldSelection.value === 'null') {
      alert('The user selection field has not been selected.');
      return false;
    }
    config.fieldSelection = fieldSelection.value;
    config.bgColor = bgColor.value;
    kintone.plugin.app.setConfig(config);
    return true;
  };

  // Cancel the process if the cancel button is clicked
  cancelButton.onclick = () => {
    history.back();
  };

  setUserSelection().then(() => {
    setDefault();
  });

})(kintone.$PLUGIN_ID);
