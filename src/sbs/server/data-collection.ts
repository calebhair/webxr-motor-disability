import {type Page} from 'playwright';

function styleElement(element: HTMLElement, newStyle: CSSStyleDeclaration): Record<string, string> {
    const prevStyle: Record<string, string> = {};
    for (const prop of Object.keys(newStyle)) {
        prevStyle[prop] = element.style[prop];
    }
    
    Object.assign(element.style, newStyle);
    
    return prevStyle;
}


export class DataCollector {
    private page: Page;
    private selectors: string[];
    private progress: number = -1; // selector index
    
    constructor(page: Page) {
        this.page = page;
        this.selectors = ['.nav-btn'];
    }

    get pageOK(): boolean {
        const { page } = this;
        if (!page || page.isClosed()) return false;

        const context = page.context();
        if (!context || context.isClosed()) return false;

        const browser = context.browser();
        return browser === null || browser.isConnected();
    }
    
    nextSelector() {
        
    }
    
    onTouchEvent(type, touchPoints) {
        
    }

    async highlightElement(selector: string) {
        if (!this.pageOK) return;
        
        // @ts-expect-error CSSStyleDeclaration requires all attributes, we just want to specify a select few
        const styleChanges: CSSStyleDeclaration = {
            background: 'red',
        };

        const oldStyle = await this.setElementStyle(selector, styleChanges);
        setTimeout(async () => {
            await this.setElementStyle(selector, oldStyle);
        }, 1000);
    }
    
    async setElementStyle(selector: string, style: CSSStyleDeclaration | Record<string, string>) {
        if (!this.pageOK) return;
        return await this.page.locator(selector).evaluate(styleElement, style);
    }
}