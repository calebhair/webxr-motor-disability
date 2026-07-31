export function onPageLoad() {


function showSelectOptions(event) {
    const select: HTMLSelectElement = event.target
    
    const selectOptionsDisplay = document.createElement('div')
    selectOptionsDisplay.style.position = 'fixed';
    selectOptionsDisplay.style.left = select.offsetLeft + 'px';
    selectOptionsDisplay.style.top = select.offsetTop + 'px';
    selectOptionsDisplay.style.zIndex = '1000';

    // document.addEventListener('mousedown', () => {
    //     console.log('close select')
    //     document.body.removeChild(selectOptionsDisplay);
    // }, { once: true });

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



document.addEventListener('DOMContentLoaded', () => {
    // wait for the page's own selects to exist, then replace them
    const replaceSelects = () => {
        document.querySelectorAll('select:not([data-replaced])').forEach((select: HTMLSelectElement) => {
            select.setAttribute('data-replaced', 'true');
            // initialize your chosen library on this element, e.g.:
            select.addEventListener("click", showSelectOptions);
        });
    };
    replaceSelects();
    // handle selects added dynamically after initial load
    new MutationObserver(replaceSelects).observe(document.body, { childList: true, subtree: true });
});


}
