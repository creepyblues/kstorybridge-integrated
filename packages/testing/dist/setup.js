// Jest/Vitest setup file for all tests
import '@testing-library/jest-dom';
// Mock window.matchMedia for tests that use responsive components
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
    }),
});
// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor() {
        Object.defineProperty(this, "observe", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
        Object.defineProperty(this, "disconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
        Object.defineProperty(this, "unobserve", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
    }
}
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
});
// Mock ResizeObserver
class MockResizeObserver {
    constructor() {
        Object.defineProperty(this, "observe", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
        Object.defineProperty(this, "disconnect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
        Object.defineProperty(this, "unobserve", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jest.fn()
        });
    }
}
Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: MockResizeObserver,
});
// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render is deprecated')) {
            return;
        }
        originalError.call(console, ...args);
    };
});
afterAll(() => {
    console.error = originalError;
});
