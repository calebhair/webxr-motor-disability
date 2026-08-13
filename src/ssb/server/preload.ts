declare const AirDatepicker;
declare const SimpleKeyboard;
type SimpleKeyboard = typeof SimpleKeyboard;

// onPageLoad is run as a browser script.
// Avoid importing from other files, or referring to functions outside onPageLoad.
export function onPageLoad() {

    let lastFocusedInput: HTMLInputElement;
    let globalKeyboard: SimpleKeyboard;
    let kbContainer: HTMLDivElement;
    document.addEventListener('DOMContentLoaded', () => {
        globalKeyboard = setupKeyboard();
        addSelectStyle();
        setupColorPicker();
        insertCustomOverlays();

        // In case elements are added (e.g., SPA)
        new MutationObserver(insertCustomOverlays)
            .observe(document.body, { childList: true, subtree: true });
    });

    function insertCustomOverlays() {
        addAirDatePicker('input[type="date"]'); // Date
        addAirDatePicker('input[type="datetime-local"]', { timepicker: true }); // Datetime
        addAirDatePicker('input[type="month"]', { view: 'months', minView: 'months', dateFormat: 'yyyy-MM' }); // Month
        addAirDatePicker('input[type="time"]', { timepicker: true, onlyTimepicker: true }); // Time
        setupInputsForKeyboard(globalKeyboard);
    }

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
                ...airDatepickerSettings,
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
        timeFormat: 'HH:mm',
        firstDay: 0,
    };

    function setupKeyboard(): SimpleKeyboard {
        kbContainer = document.createElement('div');
        const { style: kbContainerStyle } = kbContainer;
        kbContainer.classList.add('simple-keyboard');
        kbContainerStyle.position = 'fixed';
        kbContainerStyle.bottom = '0';
        kbContainerStyle.left = '0';
        kbContainerStyle.width = '100%';
        kbContainer.hidden = true;
        document.body.appendChild(kbContainer);

        function onChange(keyboardValue: string) {
            lastFocusedInput.value = keyboardValue;
        }

        function onKeyPress(button: string) {
            if (button.includes('{') && button.includes('}')) {
                handleLayoutChange(button);
            }
            if (button === '{downkeyboard}') {
                kbContainer.hidden = true;
            }
        }

        const keyboard = new SimpleKeyboard.default({
            onChange, onKeyPress,
            theme: 'hg-theme-default hg-theme-ios',
            layout: {
                default: [
                    'q w e r t y u i o p',
                    'a s d f g h j k l {enter}',
                    '{shift} z x c v b n m , . {bksp}',
                    '{alt} {smileys} {space} {downkeyboard}',
                ],
                shift: [
                    'Q W E R T Y U I O P',
                    'A S D F G H J K L {enter}',
                    '{shiftactivated} Z X C V B N M {bksp}',
                    '{alt} {smileys} {space} {downkeyboard}',
                ],
                alt: [
                    '1 2 3 4 5 6 7 8 9 0',
                    '- + * / ( ) £ $ & @ # "',
                    ". , : ; ? ! ' {bksp}",
                    '{default} {smileys} {space} {downkeyboard}',
                ],
                smileys: [
                    '😀 😊 😅 😂 🙂 😉 😍 😛 😠 😎',
                    `😏 😬 😭 😓 😱 😪 😬 😴 😯 {enter}`,
                    '😐 😇 🤣 😘 😚 😆 😡 😥 😓 🙄 {bksp}',
                    '{default} {smileys} {space} {downkeyboard}',
                ],
            },
            display: {
                '{alt}': '.?123',
                '{smileys}': '\uD83D\uDE03',
                '{shift}': '⇧',
                '{shiftactivated}': '⇧',
                '{enter}': 'return',
                '{bksp}': '⌫',
                '{altright}': '.?123',
                '{downkeyboard}': '🞃',
                '{space}': '..............................',
                '{default}': 'ABC',
                '{back}': '⇦',
            },
        });

        function handleLayoutChange(button: string) {
            const currentLayout = keyboard.options.layoutName;
            let layoutName: string;

            switch (button) {
                case '{shift}':
                case '{shiftactivated}':
                case '{default}':
                    layoutName = currentLayout === 'default' ? 'shift' : 'default';
                    break;

                case '{alt}':
                case '{altright}':
                    layoutName = currentLayout === 'alt' ? 'default' : 'alt';
                    break;

                case '{smileys}':
                    layoutName = currentLayout === 'smileys' ? 'default' : 'smileys';
                    break;

                default:
                    break;
            }

            if (layoutName) {
                keyboard.setOptions({ layoutName: layoutName });
            }
        }

        return keyboard;
    }

    function setupInputsForKeyboard(keyboard: SimpleKeyboard) {
    // TODO restrict to certain inputs
        document.querySelectorAll('input:not([data-replaced])').forEach((inputElement: HTMLInputElement) => {
            inputElement.setAttribute('data-replaced', 'true');
            setupIndividualInput(inputElement, keyboard);
        });
    }

    function setupIndividualInput(inputElement: HTMLInputElement, keyboard: SimpleKeyboard) {
        inputElement.addEventListener('input', () => {
            keyboard.setInput(inputElement.value);
        });

        inputElement.addEventListener('focus', () => {
            lastFocusedInput = inputElement;
            keyboard.setInput(inputElement.value);
            kbContainer.hidden = false;
        });
    }

    function setupColorPicker() {
        document.querySelectorAll('input[type=color]:not([data-replaced])').forEach((colorInput: HTMLInputElement) => {
            colorInput.setAttribute('data-replaced', 'true');

            const pickr = Pickr.create({
                el: colorInput,
                theme: 'nano',
                closeOnScroll: true,
                useAsButton: true,
                defaultRepresentation: 'HEX',

                swatches: [
                    'rgba(255, 255, 255, 1)',
                    'rgba(0, 0, 0, 1)',
                    'rgba(255, 0, 0, 1)',
                    'rgba(0, 255, 0, 1)',
                    'rgba(0, 0, 255, 1)',
                    'rgba(255, 0, 255, 1)',
                    'rgba(255, 255, 0, 1)',
                ],

                components: {
                    preview: true, opacity: true, hue: true,
                    interaction: { input: true },
                },
            });

            pickr.on('change', (color) => {
                colorInput.value = color.toHEXA().toString();
            });
        });
    }
}