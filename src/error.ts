export class MyError extends Error {
    constructor(msg: string) {
        super(msg);
        Object.setPrototypeOf(this, MyError.prototype);
    }
}

export class NotImplementedError extends MyError {
    constructor(msg: string) {
        super(msg);
    }
}

export class KeyError extends MyError {
    constructor(msg: string) {
        super(msg);
    }
}

export class ValueError extends MyError {
    constructor(msg: string) {
        super(msg);
    }
}

export type StackTrace = string;
