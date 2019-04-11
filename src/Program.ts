namespace mmk.terminal {
    /** @hidden */
    function createShader (description: string, webgl: WebGLRenderingContext, type: number, source: string): WebGLShader {
        const shader = webgl.createShader(type);
        if (!shader) throw `Unable to create shader: ${description}`;
        webgl.shaderSource(shader, source);
        webgl.compileShader(shader);
        if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
            const compileErrors = webgl.getShaderInfoLog(shader);
            throw `Could not compile WebGL ${JSON.stringify(description)}:\n\n${compileErrors}`;
        }
        return shader;
    }

    /** @hidden */
    export type UniformsBag = {[id: string]: number | number[] | Texture};

    /** @hidden */
    export class Program<Uniforms extends UniformsBag = UniformsBag> {
        public constructor (webgl: WebGLRenderingContext, vertexShader: string, fragmentShader: string, attribs: string[]) {
            const program = webgl.createProgram();
            if (!program) throw `Unable to create shader program`;
            webgl.attachShader(program, createShader("vertex shader", webgl, webgl.VERTEX_SHADER, vertexShader));
            webgl.attachShader(program, createShader("fragment shader", webgl, webgl.FRAGMENT_SHADER, fragmentShader));
            webgl.linkProgram(program);
            webgl.validateProgram(program);
            if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
                const linkErrors = webgl.getProgramInfoLog(program);
                throw `Couldn't compile/link WebGL program.\n\n${linkErrors}`;
            }

            this.program = program;
            this.attribs = attribs;
        }

        public bind (webgl: WebGLRenderingContext, uniforms: Uniforms) {
            const {program, attribs, uniformsCache} = this;
            webgl.useProgram(program);
            for (let i=0; i<attribs.length; ++i) webgl.bindAttribLocation(program, i, attribs[i]);

            let texIndex = 0;
            for (const name of Object.keys(uniforms)) {
                const value = uniforms[name];
                let location = uniformsCache[name];
                if (location === undefined) location = uniformsCache[name] = webgl.getUniformLocation(program, name);
                if (location === null) continue;
                if (typeof value === 'number') {
                    webgl.uniform1f(location, value);
                }
                else if (Array.isArray(value)) {
                    const array = new Float32Array(value);
                    switch (value.length) {
                        case 1:     webgl.uniform1fv(location, array); break;
                        case 2:     webgl.uniform2fv(location, array); break;
                        case 3:     webgl.uniform3fv(location, array); break;
                        case 4:     webgl.uniform4fv(location, array); break;
                        case 9:     webgl.uniformMatrix3fv(location, false, array); break;
                        case 16:    webgl.uniformMatrix4fv(location, false, array); break;
                        default:    throw `Invalid uniform value for ${JSON.stringify(name)}: ${JSON.stringify(array)}`;
                    }
                }
                else { // texture
                    value.tryBindTo(webgl, texIndex);
                    webgl.uniform1i(location, texIndex);
                    ++texIndex;
                }
            }
        }

        private readonly program: WebGLProgram;
        private readonly attribs: string[];
        private readonly uniformsCache: {[id: string]: WebGLUniformLocation | null | undefined} = {};
    }
}
