const utils = {
    getYMD(date) {
        const year = date.getFullYear();
        const month = `0${date.getMonth() + 1}`.slice(-2);
        const day = `0${date.getDate()}`.slice(-2);
        return `${year}-${month}-${day}`;
    },

    getHM(date) {
        const hour = `0${date.getHours()}`.slice(-2);
        const minute = `0${date.getMinutes()}`.slice(-2);
        return `${hour}h${minute}`;
    },

    getDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const remaining = minutes - 60 * hours;
        return `${hours}h${remaining ? `${remaining}` : ''}`;
    },
};

module.exports = utils;
