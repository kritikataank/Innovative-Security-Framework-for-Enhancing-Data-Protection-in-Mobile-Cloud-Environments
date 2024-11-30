declare module 'simon' {
    export function encrypt(key: Buffer, data: Buffer): Buffer;
    export function decrypt(key: Buffer, data: Buffer): Buffer;
}