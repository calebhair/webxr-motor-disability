declare const AirDatepicker: any;

// onPageLoad is loaded as a browser script. Avoid importing from other files or referring to functions outside onPageLoad
export function onPageLoad() {


function insertCustomOverlays() {
    addAirDatePicker('input[type="date"]') // Date
    addAirDatePicker('input[type="datetime-local"]', { timepicker: true }) // Datetime
    addAirDatePicker('input[type="month"]', { view: 'months', minView: 'months', dateFormat: 'yyyy-MM' }) // Month
    addAirDatePicker('input[type="time"]', { timepicker: true, onlyTimepicker: true }) // Time
}

document.addEventListener('DOMContentLoaded', () => {
    addSelectStyle();
    insertCustomOverlays();

    // In case elements are added (e.g., SPA)
    new MutationObserver(insertCustomOverlays)
        .observe(document.body, { childList: true, subtree: true });
});

/**
 * Adds a style tag that causes selects to show in HTML instead of using browser overlay
 */
function addSelectStyle() {
    const styleTag = document.createElement('style');
    styleTag.id = 'base-select-appearance-style';
    styleTag.textContent = `select, ::picker(select) { appearance: base-select; }`;
    document.head.appendChild(styleTag);
}

/**
 * Inserts an Air Datepicker (https://air-datepicker.com/)
 * @param querySelector the element to tie to the datepicker (an input)
 * @param airDatepickerSettings https://air-datepicker.com/docs
 */
function addAirDatePicker(querySelector: string, airDatepickerSettings = {}) {
    document.querySelectorAll(`${querySelector}:not([data-replaced])`).forEach((datepicker: HTMLInputElement) => {
        datepicker.setAttribute('data-replaced', 'true');
        new AirDatepicker(datepicker, {
            locale: defaultDatepickerEnglishLocale,
            isMobile: true, // Shows as modal, gets around issues with some positioning
            ...airDatepickerSettings
        });
    });
}

// Default configuration for date picker.
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

}