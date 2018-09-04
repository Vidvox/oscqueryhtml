// Get the value of an html control, and return it as an OSC argument.
function getControlArg(controlElem) {
    let inputElem = controlElem.querySelector('input');
    if (!inputElem) {
        inputElem = controlElem.querySelector('select');
    }
    let detailsElem = controlElem.querySelector('.details');
    let fullPath = detailsElem.attributes['data-full-path'].value;
    let dataType = detailsElem.attributes['data-type'].value;
    let getter = detailsElem.attributes['data-getter'];
    let arg = null;
    if (!getter) {
        return {type: dataType};
    } else if (getter.value == 'value') {
        return {type: dataType, value: inputElem.value };
    } else if (getter.value == 'parseInt') {
        return {type: dataType, value: parseInt(inputElem.value, 10) };
    } else if (getter.value == 'parseInt64') {
        let num = parseInt(inputElem.value);
        let radix = 0x100000000;
        let high = Math.floor(num / radix);
        let low = num % radix;
        return {type: dataType, value: {high: high, low: low}};
    } else if (getter.value == 'parseFloat') {
        return {type: dataType, value: parseFloat(inputElem.value) };
    } else if (getter.value == 'parseSingle') {
        let first = inputElem.attributes['data-first'].value;
        return {type: dataType, value: parseInt(first, 10) };
    } else if (getter.value == 'boolToggle') {
        return {type: inputElem.value == 'true' ? 'T' : 'F'};
    } else if (getter.value == 'parseIntToggle') {
        let value = null;
        let dataFirst = inputElem.attributes['data-first']
        let dataSecond = inputElem.attributes['data-second']
        if (dataFirst.value == inputElem.value) {
            value = dataFirst.value;
        } else {
            value = dataSecond.value;
        }
        return {type: dataType, value: parseInt(value, 10) };
    } else if (getter.value == 'sendCheckbox') {
        let value;
        if (inputElem.checked) {
            value = parseInt(inputElem.attributes['data-second'].value, 10);
        } else {
            value = parseInt(inputElem.attributes['data-first'].value, 10);
        }
        return {type: dataType, value: value};
    } else if (getter.value == 'color') {
        if (!inputElem) {
            // Only for color elements in browsers that don't support the
            // html5 color input.
            inputElem = controlElem.querySelector('.color-control');
        }
        var color = inputElem.value;
        var r = parseInt(color.substr(1, 2), 16);
        var g = parseInt(color.substr(3, 2), 16);
        var b = parseInt(color.substr(5, 2), 16);
        return {type: dataType, value: {r:r, g:g, b:b, a:1} };
    }
}

// Set the value of an html control, based upon the type it represents.
function runSetter(controlElem, type, value) {
    if (type == 'int') {
        let currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = value;
    } else if (type == 'int64') {
        let currValElem = controlElem.querySelector('.curr-val');
        if (value.hasOwnProperty('high') && value.hasOwnProperty('low')) {
            let radix = 0x100000000;
            value = value.high * radix + value.low;
        }
        currValElem.textContent = value;
    } else if (type == 'float') {
        let currValElem = controlElem.querySelector('.curr-val');
        currValElem.textContent = Math.round(value * 1000) / 1000;
    } else if (type == 'setToggleBeforeGetControlArg') {
        let buttonElem = controlElem.querySelector('input');
        let dataFirst = buttonElem.attributes['data-first']
        let dataSecond = buttonElem.attributes['data-second']
        let isEnabled;
        if (dataFirst && dataSecond) {
            if (dataFirst.value == value) {
                value = dataSecond.value;
                isEnabled = false;
            } else {
                value = dataFirst.value;
                isEnabled = true;
            }
        } else {
            if (value === false || value == 'false') {
                value = 'true';
                isEnabled = true;
            } else {
                value = 'false';
                isEnabled = false;
            }
        }
        buttonElem.value = value;
        if (isEnabled) {
            buttonElem.classList.add('enabled');
        } else {
            buttonElem.classList.remove('enabled');
        }
    } else if (type == 'setToggle') {
        // do nothing
    } else if (type == 'button') {
        // do nothing
    }
}

module.exports = {
    getControlArg: getControlArg,
    runSetter: runSetter,
}
