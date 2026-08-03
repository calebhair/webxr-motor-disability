declare const AirDatepicker: any;

export function onPageLoad() {

function replace() {
    replaceDatepickerWithAirDP('input[type="date"]')
    replaceDatepickerWithAirDP('input[type="datetime-local"]', { timepicker: true })
    replaceDatepickerWithAirDP('input[type="month"]', { view: 'months', minView: 'months', dateFormat: 'yyyy-MM' })
    replaceDatepickerWithAirDP('input[type="time"]', { timepicker: true, onlyTimepicker: true })
}
document.addEventListener('DOMContentLoaded', () => {
    addSelectStyle();
    replace()
    // In case elements are added (e.g., SPA)
    new MutationObserver(replace).observe(document.body, { childList: true, subtree: true });
});

function replaceDatepickerWithAirDP(querySelector, airDPSettings = {}) {
    document.querySelectorAll(`${querySelector}:not([data-replaced])`).forEach((datepicker: HTMLInputElement) => {
        // TODO ignore custom ones?
        datepicker.setAttribute('data-replaced', 'true');
        new AirDatepicker(datepicker, {
            locale: defaultDatepickerEnglishLocale,
            isMobile: true,
            ...airDPSettings
        });
    });
}
// https://air-datepicker.com/docs#
const defaultDatepickerEnglishLocale = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: ['January','February','March','April','May','June', 'July','August','September','October','November','December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    clear: 'Clear',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'hh:mm',
    firstDay: 0
};

function addSelectStyle() {
    const styleTag = document.createElement('style');
    styleTag.id = 'base-select-appearance-style';
    styleTag.textContent = `select, ::picker(select) { appearance: base-select; }`;
    document.head.appendChild(styleTag);
}

}