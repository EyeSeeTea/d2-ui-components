declare module "enzyme-adapter-react-16";

declare module "loglevel" {
    const log: {
        trace(...msg: unknown[]): void;
        debug(...msg: unknown[]): void;
        info(...msg: unknown[]): void;
        warn(...msg: unknown[]): void;
        error(...msg: unknown[]): void;
        setLevel(level: string | number): void;
    };
    export default log;
}

declare module "@dhis2/d2-i18n" {
    export function t(value: string): string;
    export function t(
        value: string,
        options?: {
            nsSeparator?: boolean;
            [key: string]: any;
        }
    ): string;
}
