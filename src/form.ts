document.addEventListener('DOMContentLoaded', () => {
    const targetUrl = <HTMLInputElement> document.getElementById('targetUrl');
    const targetUrlLabel = document.querySelector('[for=targetUrl]');
    const useSearch = <HTMLInputElement> document.getElementById('useSearch');
    
    useSearch.addEventListener('change', () => {
        const currentUrl = targetUrl.value;
        if (useSearch.checked) {
            targetUrlLabel.textContent = 'Search';
            removeProtocolPrefixes(targetUrl);
        }
        else {
            targetUrlLabel.textContent = 'URL';
            if (currentUrl.length === 0) {
                targetUrl.value = 'https://';
            }
        }
    });
});

const prefixes = ['https://', 'http://'];
function removeProtocolPrefixes(input: HTMLInputElement) {
    const currentValue = input.value;
    for (const prefix of prefixes) {
        if (currentValue.startsWith(prefix)) {
            input.value = currentValue.replace(prefix, '');
        }
    }
}
