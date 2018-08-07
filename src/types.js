function extractControlKind(type, html) {
    if (type == 'c') {
        if (html.includes('<select>')) {
            return 'dropdown';
        } else {
            return 'char';
        }
    } else if (type == 'r') {
        return 'color';
    } else if (type == 'd' || type == 'f' || type == 'i' || type == 'h') {
        if (html.includes('<select>')) {
            return 'dropdown';
        } else if (html.includes('<input type="checkbox"')) {
            return 'checkbox';
        } else if (html.includes('<input type="button"')) {
            return 'button';
        } else {
            return 'slider';
        }
    } else if (type == 's') {
        if (html.includes('<select>')) {
            return 'dropdown';
        } else {
            return 'text';
        }
    } else if (type == 'F' || type == 'I' || type == 'N' || type == 'T') {
        return 'button';
    } else if (type == 'm' || type == 't') {
        return 'none';
    } else {
        return 'unknown';
    }
}

function typeToControlName(type) {
    if (type == 'c') {
        return 'char';
    } else if (type == 'r') {
        return 'color';
    } else if (type == 'd') {
        return 'double';
    } else if (type == 'F') {
        return 'false';
    } else if (type == 'f') {
        return 'float';
    } else if (type == 'I') {
        return 'infinity';
    } else if (type == 'i') {
        return 'integer';
    } else if (type == 'h') {
        return 'longlong';
    } else if (type == 'm') {
        return 'midi';
    } else if (type == 'N') {
        return 'null';
    } else if (type == 'a') {
        return 'string';
    } else if (type == 'T') {
        return 'true';
    } else if (type == 't') {
        return 'timetag';
    } else {
        return 'unknown';
    }
}

module.exports = {
    extractControlKind: extractControlKind,
}
