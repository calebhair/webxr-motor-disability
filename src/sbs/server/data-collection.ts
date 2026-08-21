import {type Page} from 'playwright';

const MAX_DISTANCE_FOR_ATTEMPTED_TOUCH = 100;

interface SelectorState {
    selector: string;
    previousStyle?: Record<string, string>;
}
interface TouchPoint {
    x: number;
    y: number;
    id: number;
}

// @ts-expect-error CSSStyleDeclaration requires all attributes, we just want to specify a select few
const HIGHLIGHT_STYLE: CSSStyleDeclaration = {
    background: 'red',
};

function styleElement(element: HTMLElement, newStyle: CSSStyleDeclaration): Record<string, string> {
    const prevStyle: Record<string, string> = {};
    for (const prop of Object.keys(newStyle)) {
        prevStyle[prop] = element.style[prop];
    }
    
    Object.assign(element.style, newStyle);
    
    return prevStyle;
}

// Source - https://stackoverflow.com/a/5354536
// Posted by Tokimon, modified by community. See post 'Timeline' for change history
// Retrieved 2026-08-21, License - CC BY-SA 4.0
function checkVisible(elm) {
    const rect = elm.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
}


export class DataCollector {
    private page: Page;
    private selectors: SelectorState[];
    private progress: number = -1; // selector index
    private previousPoints: TouchPoint[];
    
    constructor(page: Page) {
        this.page = page;
        this.selectors = [{ selector: '.nav-btn' }];
    }

    get pageOK(): boolean {
        const { page } = this;
        if (!page || page.isClosed()) return false;

        const context = page.context();
        if (!context || context.isClosed()) return false;

        const browser = context.browser();
        return browser === null || browser.isConnected();
    }
    
    get currentSelectorState(): SelectorState {
        return this.selectors[this.progress];
    }
    
    async nextSelector() {
        if (this.progress > -1) {
            // Revert style change
            const selectorState = this.currentSelectorState;
            this.setElementStyle(selectorState.selector, selectorState.previousStyle);
        }
        this.progress++;
        
        const selectorState = this.currentSelectorState;
        selectorState.previousStyle = await this.setElementStyle(selectorState.selector, HIGHLIGHT_STYLE);
    }
    
    async onTouchEvent(type: 'touchStart' | 'touchMove' | 'touchEnd', touchPoints: TouchPoint[]) {
        if (type !== 'touchEnd') {
            this.previousPoints = touchPoints;
            return;
        }

        // TODO When multi point touch is added, will need to detect which finger was removed.
        const removedPoint = this.previousPoints.find(point => point.id === 0);
        
        const currentSelector = this.currentSelectorState.selector;
        // If the target element is on screen, and the touch was close enough to be considered an attempted tap...
        if (!await this.isSelectorOnScreen(currentSelector)) return;
        const { touched, distance } = await this.getTouchDistanceFromElementEdge(currentSelector, removedPoint);
        if (distance > MAX_DISTANCE_FOR_ATTEMPTED_TOUCH) return;
        
        // This was an attempt to press the current target.
        let score;
        if (touched) score = 1;
        else if (this.isElementClickable(this.getTouchedElement(removedPoint))) score = -1;
        else score = 0;
        
        await this.nextSelector();
    }
    
    async setElementStyle(selector: string, style: CSSStyleDeclaration | Record<string, string>) {
        if (!this.pageOK || !style) return;
        // TODO more error handling eg if element doesnt exist
        return await this.page.locator(selector).evaluate(styleElement, style);
    }
    
    async isSelectorOnScreen(selector: string) {
        return await this.page.locator(selector)
            .evaluate(element => checkVisible(element) && element.checkVisibility());
    }
    
    async getTouchDistanceFromElementEdge(selector: string, { x: touchX, y: touchY }: TouchPoint) {
        return await this.page.locator(selector).evaluate((element: HTMLElement) => {
            const elRect = element.getBoundingClientRect();
            
            let dx;
            if (elRect.x < touchX) dx = touchX - elRect.right; // If touch to the right, get distance from right edge
            else dx = elRect.left - touchX; // Else to left, get distance from left edge
            
            let dy;
            if (elRect.y < touchY) dy = touchY - elRect.bottom; // Touch below element
            else dy = elRect.bottom - touchY; // Touch above
            
            return {
                touched: dx < 0 && dy < 0, 
                distance: Math.sqrt(dx * dx + dy * dy),
            };
        });
    }
    
    async getTouchedElement({ x, y }: TouchPoint) {
        
    }
    
    async isElementClickable(element: HTMLElement) {
        return false; // TODO
    }
}