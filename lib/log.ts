import { getIsDevMode } from "@/services/core"
export function log(out: any) {
    if (getIsDevMode()) {
        console.log(getOutStr(out));
    }
}
export function warn(out: any) {
    if (getIsDevMode()) {
        console.warn(getOutStr(out));
    }
}
export function error(out: any) {
    if (getIsDevMode()) {
        console.error(getOutStr(out));
    }
}
function isString(value: any): boolean {
    return typeof value === "string";
}
function getOutStr(out: any) {
    return isString(out) ? out : (out + "");
}