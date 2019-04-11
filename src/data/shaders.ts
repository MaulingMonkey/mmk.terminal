/** @hidden */
namespace mmk.terminal.shaders {
    /** @hidden */ export type vec1 = [number];
    /** @hidden */ export type vec2 = [number, number];
    /** @hidden */ export type vec3 = [number, number, number];
    /** @hidden */ export type vec4 = [number, number, number, number];

    /** @hidden */ export type mat3 = [number, number, number, number, number, number, number, number, number];
    /** @hidden */ export type mat4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
}

/** @hidden */
namespace mmk.terminal.shaders.terminal {

const common = `
varying mediump vec2 vTexCoord;
varying lowp    vec3 vForeground;
varying lowp    vec3 vBackground;
`.trim();

const vs = `// Terminal vertex shader

attribute highp   vec2 aPosition;
attribute mediump vec2 aTexCoord;
attribute lowp    vec3 aForeground;
attribute lowp    vec3 aBackground;
${common}
uniform vec2 uOrigin;
uniform vec2 uScale;

void main () {
    vec2 pos = uOrigin + aPosition * uScale;

    vTexCoord   = aTexCoord;
    vForeground = aForeground;
    vBackground = aBackground;
    gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);
}
`;

const fs = `// Terminal fragment shader

${common}
uniform sampler2D uFont;

void main () {
    lowp vec4 font = texture2D(uFont, vTexCoord);
    lowp vec3 c = mix(vBackground.rgb, vForeground.rgb, font.rgb);
    gl_FragColor = vec4(c.r, c.g, c.b, 1.0);
}
`;

export interface Uniforms extends UniformsBag {
    uFont:      Texture,
    uOrigin:    vec2,
    uScale:     vec2,
}

export function createProgram (webgl: WebGLRenderingContext): Program<Uniforms> {
    return new Program<Uniforms>(webgl, vs, fs, ["aPosition", "aTexCoord", "aForeground", "aBackground"]);
}

}
