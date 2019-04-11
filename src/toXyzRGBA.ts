namespace mmk.terminal {
    /** @hidden */
    export interface RGBA {
        r: number,
        g: number,
        b: number,
        a: number,
    }

    /** @hidden */
    export type RGBA_PreMul = RGBA & { _tag: "RGBA" };

    /** @hidden */
    export function toNoMulRGBA (color: string | undefined): RGBA | undefined {
        if (color === undefined) return undefined;
        const m = /^#([0-9a-f]+)$/i.exec(color);
        if (!m) return undefined;
        const c = m[1];
        switch (c.length) {
            case 3: return {
                r: parseInt(m[1].substr(0,1), 16) / 0xF,
                g: parseInt(m[1].substr(1,1), 16) / 0xF,
                b: parseInt(m[1].substr(2,1), 16) / 0xF,
                a: 1
            };
            case 4: return {
                r: parseInt(m[1].substr(0,1), 16) / 0xF,
                g: parseInt(m[1].substr(1,1), 16) / 0xF,
                b: parseInt(m[1].substr(2,1), 16) / 0xF,
                a: parseInt(m[1].substr(3,1), 16) / 0xF,
            };
            case 6: return {
                r: parseInt(m[1].substr(0,2), 16) / 0xFF,
                g: parseInt(m[1].substr(2,2), 16) / 0xFF,
                b: parseInt(m[1].substr(4,2), 16) / 0xFF,
                a: 1
            };
            case 8: return {
                r: parseInt(m[1].substr(0,2), 16) / 0xFF,
                g: parseInt(m[1].substr(2,2), 16) / 0xFF,
                b: parseInt(m[1].substr(4,2), 16) / 0xFF,
                a: parseInt(m[1].substr(6,2), 16) / 0xFF,
            };
            default: return undefined;
        }
    }

    /** @hidden */
    export function toPremulRGBA (color: string | undefined): RGBA_PreMul | undefined {
        const c = toNoMulRGBA(color);
        if (!c) return undefined;
        c.r *= c.a;
        c.g *= c.a;
        c.b *= c.a;
        return c as any as RGBA_PreMul;
    }
}
