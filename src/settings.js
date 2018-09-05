// Configuration changes initiated by user: LISTEN, TOGGLE, and STYLE.

// TODO: Common file.
function $(selector) {
    return document.querySelector(selector);
}

// If OSC is ready (connected), start listening, otherwise wait 10 ms.
function enableInitialListenState() {
    if (global.isOscReady) {
        listenIgnoreChange(true);
    } else {
        setTimeout(enableInitialListenState, 10);
    }
}

function listenClick(e) {
    listenIgnoreChange(true);
}

function ignoreClick(e) {
    listenIgnoreChange(false);
}

// Change the listen / ignore state, and send commands.
function listenIgnoreChange(state) {
    global.g_isListenEnabled = state;
    let command = null;
    if (state) {
        $('.svg-listen').style.display = 'none';
        $('.svg-ignore').style.display = 'inline-block';
        command = 'LISTEN';
    } else {
        $('.svg-listen').style.display = 'inline-block';
        $('.svg-ignore').style.display = 'none';
        command = 'IGNORE';
    }
    if (global.isOscReady) {
        for (let i = 0; i < global.g_allControlStruct.length; i++) {
            var path = global.g_allControlStruct[i];
            var msg = JSON.stringify(
{
    'COMMAND': command,
    'DATA': path
});
            console.log('***** Sending WS: ' + msg);
            global.oscPort.socket.send(msg);
        }
    }
}

const TOGGLE_SHOW_DISPLAY = 'grid';

// Hide some directory.
function toggleHide(e) {
    let elem = e.target;
    for (let i = 0; i < 6; i++) {
        if (elem.tagName.toLowerCase() == 'div' && elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = 'none';
    $('#toggle_show_'  + id).style.display = TOGGLE_SHOW_DISPLAY;
    $('#toggle_hide_'  + id).style.display = 'none';
    if (e.altKey) {
        let controlBody = $('#control_body_' + id);
        if (!controlBody) {
            return;
        }
        let dirContainerElems = controlBody.querySelectorAll('.dir-container');
        for (let i = 0; i < dirContainerElems.length; i++) {
            let toggleElem = dirContainerElems[i].querySelector('.toggle-hide');
            toggleHide({target: toggleElem, altKey: true});
        }
    }
}

// Show some directory.
function toggleShow(e) {
    let elem = e.target;
    for (let i = 0; i < 6; i++) {
        if (elem.tagName.toLowerCase() == 'div' && elem.id) {
            break;
        }
        elem = elem.parentNode;
    }
    let text = elem.id;
    let id = text.substr(12);
    $('#control_body_' + id).style.display = TOGGLE_SHOW_DISPLAY;
    $('#toggle_show_'  + id).style.display = 'none';
    $('#toggle_hide_'  + id).style.display = TOGGLE_SHOW_DISPLAY;
    if (e.altKey) {
        let controlBody = $('#control_body_' + id);
        if (!controlBody) {
            return;
        }
        let dirContainerElems = controlBody.querySelectorAll('.dir-container');
        for (let i = 0; i < dirContainerElems.length; i++) {
            let toggleElem = dirContainerElems[i].querySelector('.toggle-show');
            toggleShow({target: toggleElem, altKey: true});
        }
    }
}

// Set the visual style to light or dark.
function setStyleMode(mode) {
    if (mode == 'light') {
        $('#choice-dark-mode').style.display = 'none';
        $('#choice-light-mode').style.display = 'block';
        $('body').classList.add('light');
        document.cookie = 'style=light';
    } else if (mode == 'dark') {
        $('#choice-light-mode').style.display = 'none';
        $('#choice-dark-mode').style.display = 'block';
        $('body').classList.remove('light');
        document.cookie = 'style=dark';
    }
}

module.exports = {
    enableInitialListenState: enableInitialListenState,
    listenClick: listenClick,
    ignoreClick: ignoreClick,
    toggleHide: toggleHide,
    toggleShow: toggleShow,
    setStyleMode: setStyleMode,
}
