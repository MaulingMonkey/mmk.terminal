namespace mmk.terminal {
    /** @hidden */
    const warnedAbout : {[id: string]: true | undefined} = {};

    /** @hidden */
    export function warnAbout (id: string, reason: string) {
        if (warnedAbout[id]) return;
        console.warn(`#${id}: ${reason}`);
        warnedAbout[id] = true;
    }
}
