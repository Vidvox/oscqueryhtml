function objectGetValue(obj, i) {
    return obj[Object.keys(obj)[i]];
}

module.exports.objectGetValue = objectGetValue;
