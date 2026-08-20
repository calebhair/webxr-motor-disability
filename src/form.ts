const INVALID_URL_CLASS = 'invalid-url';

document.addEventListener('DOMContentLoaded', () => {
    const targetUrl = <HTMLInputElement> document.getElementById('targetUrl');
    const targetUrlLabel = document.querySelector('[for=targetUrl]');
    const useSearch = <HTMLInputElement> document.getElementById('useSearch');
    
    useSearch.addEventListener('change', () => {
        const currentUrl = targetUrl.value;
        if (useSearch.checked) {
            targetUrl.classList.remove(INVALID_URL_CLASS);
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
    
    targetUrl.addEventListener('input', async () => {
        if (useSearch.checked) return;
        
        const success = checkURL(targetUrl.value);
        if (!success) targetUrl.classList.add(INVALID_URL_CLASS);
        else targetUrl.classList.remove(INVALID_URL_CLASS);
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

const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
function checkURL(url: string) {
    return url.match(new RegExp(urlRegex));
}