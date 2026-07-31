declare const AirDatepicker: any;

export function onPageLoad() {


document.addEventListener('DOMContentLoaded', () => {
    replaceSelects();
    replaceDatepickers();
    // handle selects added later (e.g. in SPAs)
    new MutationObserver(replaceSelects).observe(document.body, { childList: true, subtree: true });
});

function replaceSelects() {
    document.querySelectorAll('select:not([data-replaced])').forEach((select: HTMLSelectElement) => {
        // TODO ignore custom ones?
        select.setAttribute('data-replaced', 'true');
        select.addEventListener("click", showSelectOverlay);
    });
}

function replaceDatepickers() {
    document.querySelectorAll('input[type="date"]:not([data-replaced])').forEach((datepicker: HTMLInputElement) => {
        // TODO ignore custom ones?
        datepicker.setAttribute('data-replaced', 'true');
        new AirDatepicker(datepicker, {
            locale: datepickerEnglishLocale,
        });
    });
}

// https://air-datepicker.com/docs#
const datepickerEnglishLocale = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: ['January','February','March','April','May','June', 'July','August','September','October','November','December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    clear: 'Clear',
    dateFormat: 'yyyy-MM-dd',
    timeFormat: 'hh:ii aa',
    firstDay: 0
};


function showSelectOverlay(event) {
    const select: HTMLSelectElement = event.target
    
    const selectOptionsDisplay = document.createElement('div')
    selectOptionsDisplay.style.position = 'fixed';
    selectOptionsDisplay.style.left = select.offsetLeft + 'px';
    selectOptionsDisplay.style.top = select.offsetTop + 'px';
    selectOptionsDisplay.style.zIndex = '1000';

    function closeOnOutsideClick(e: MouseEvent) {
        if (!selectOptionsDisplay.contains(e.target as Node)) close();
    }
    function close() {
        document.body.removeChild(selectOptionsDisplay);
        document.removeEventListener('mousedown', closeOnOutsideClick);
    }
    // defer attaching the listener so the *current* mousedown (the one that
    // opened the dropdown) doesn't immediately trigger it
    setTimeout(() => {
        document.addEventListener('mousedown', closeOnOutsideClick);
    }, 0);

    function makeOption(select: HTMLSelectElement, option: HTMLOptionElement) {
        const optionDiv = document.createElement('div')
        optionDiv.innerText = option.text
        optionDiv.addEventListener('click', (e) => {
            select.value = option.value
            select.dispatchEvent(new Event('change'))
            close();
        })
        return optionDiv;
    }
    
    for (let i = 0; i < select.options.length; i++) {
        selectOptionsDisplay.appendChild(makeOption(select, select.options.item(i)))
    }
    document.body.appendChild(selectOptionsDisplay);
}


}
