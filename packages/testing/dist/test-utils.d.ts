import React, { ReactElement } from 'react';
import { RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
export declare const mockSupabaseClient: {
    auth: {
        getSession: jest.Mock<any, any, any>;
        onAuthStateChange: jest.Mock<any, any, any>;
        signOut: jest.Mock<any, any, any>;
        signInWithPassword: jest.Mock<any, any, any>;
        signUp: jest.Mock<any, any, any>;
    };
    from: jest.Mock<{
        select: jest.Mock<any, any, any>;
        insert: jest.Mock<any, any, any>;
        update: jest.Mock<any, any, any>;
        delete: jest.Mock<any, any, any>;
        eq: jest.Mock<any, any, any>;
        single: jest.Mock<any, any, any>;
        then: jest.Mock<any, any, any>;
    }, [], any>;
};
interface TestProvidersProps {
    children: React.ReactNode;
    queryClient?: QueryClient;
    initialRoute?: string;
}
export declare function TestProviders({ children, queryClient, initialRoute, }: TestProvidersProps): import("react/jsx-runtime").JSX.Element;
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
    initialRoute?: string;
    wrapper?: React.ComponentType<any>;
}
export declare function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions): RenderResult;
export declare function createMockUser(overrides?: any): any;
export declare function createMockProfile(overrides?: any): any;
export declare const createMockQueryResponse: (data: any, isLoading?: boolean, error?: any) => {
    data: any;
    isLoading: boolean;
    error: any;
    isError: boolean;
    isSuccess: boolean;
    refetch: jest.Mock<any, any, any>;
};
export declare const waitForStabilization: () => Promise<unknown>;
export declare const createMockMutation: (options?: any) => any;
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
