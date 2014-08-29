function toLongDate(date) {
    return date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
}

function toShortDate(date) {
    return toLongDate(date).substring(0, 8);
}

module.exports = {
    toLongDate: toLongDate,
    toShortDate: toShortDate
};
