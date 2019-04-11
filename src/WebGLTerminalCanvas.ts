namespace mmk.terminal {
    /** @hidden */
    const vertexComponents = (
        +2 // Position
        +2 // UV
        +3 // Foreground
        +3 // Background
    );

    /** Construction parameters for `TextTerminalCanvas` */
    export interface WebGLTerminalCanvasParams {
        /** Required.  Either an HTML Canvas, or an id corresponding to one. */
        canvas:             HTMLCanvasElement | string;

        /** Default: `"#111"`.  A style string for the initial cleared-to color of the terminal canvas.  This is expected to be an opaque color. */
        background?:        string;

        /** Default: A built-in 8x8 PC BIOS font */
        font?:              fonts.BitmapFont;

        /** Default: `[80, 25]`.  This is the `[width, height]`, in character cells, of the entire terminal canvas. */
        bufferSize?:        [number, number];

        /** Default: `1`.  This is a multiplier on the auto-set canvas width/height. */
        zoom?:              number;
    }

    /** A write-only terminal canvas that uses the 2d canvas text rendering APIs to display text. */
    export class WebGLTerminalCanvas {
        /**
         * Create a `WebGLTerminalCanvas`.  Default parameters:
         * 
         * ```ts
         * {
         *     canvas:     REQUIRED,
         *     background: '#FFF',
         *     font:       { image: `${builtin}`, charSize: [8, 8], gridSize: [...] },
         *     bufferSize: [80, 25],
         *     zoom:       1,
         * }
         * ```
         */
        public constructor (params: WebGLTerminalCanvasParams) {
            const font = params.font || fonts.pc_bios_8x8;

            this.cellW = font.charSize[0];
            this.cellH = font.charSize[1];
            this.gridW = font.gridSize[0];
            this.gridH = font.gridSize[1];
            this.buffW = params.bufferSize === undefined ? 80 : params.bufferSize[0];
            this.buffH = params.bufferSize === undefined ? 25 : params.bufferSize[1];
            
            let {canvas} = params;
            if (typeof canvas === 'string') {
                canvas = document.getElementById(canvas) as HTMLCanvasElement;
                if (!canvas) throw `WebGLTerminalCanvas({ canvas: ${JSON.stringify(params.canvas)} }): No element with that ID`;
                if (canvas.tagName.toUpperCase() !== 'CANVAS') throw `WebGLTerminalCanvas({ canvas: ${JSON.stringify(params.canvas)} }): Element is not a canvas`;
            }
            if (!(canvas instanceof HTMLCanvasElement)) throw `WebGLTerminalCanvas({ canvas: ... }): Element is not a canvas`;
            
            this.canvas = canvas;
            canvas.width  = this.cellW * this.buffW;
            canvas.height = this.cellH * this.buffH;
            const zoom = params.zoom || 1;
            canvas.style.width  = `${(canvas.width  * zoom)|0}px`;
            canvas.style.height = `${(canvas.height * zoom)|0}px`;

            const webgl = this.webgl = canvas.getContext("webgl")!;
            if (!webgl) throw `WebGLTerminalCanvas(...): Unable to get a WebGL context`;

            const background = toPremulRGBA(params.background || '#111');
            if (background === undefined) throw `WebGLTerminalCanvas({ background: ${JSON.stringify(params.background)} }): Not a valid #RRGGBB color`;
            if (background.a !== 1) throw `WebGLTerminalCanvas({ background: ${JSON.stringify(params.background)} }): Expected 100% opacity alpha`;
            
            this.ib = this.createIB();
            this.vb = this.createVB(background);
            this.fontTexture = new Texture(webgl, font.image);
            
            const {r,g,b,a} = background;
            webgl.clearColor(r,g,b,1.0);

            this.program = shaders.terminal.createProgram(webgl);
        }

        /**
         * Set a cell of the terminal canvas to a given character, foreground color, and background color.
         * For `WebGLTerminalCanvas`, this immediately renders the character to the canvas.
         * 
         * @param left  The logical X coordinate of the character cell to render to.  `0` is the leftmost column.
         * @param top   The logical Y coordinate of the character cell to render to.  `0` is the topmost row.
         * @param char  The character to render to the cell.  Technically, you could pass a whole string here, but it will be centered within and clipped to the cell boundaries.
         * @param foreground A foreground style string such as `'#FFF'` to render the character with.
         * @param background A background style string such as `'#000'` to fill the background of the cell with.  This is expected to be an opaque color.
         */
        public set (left: number, top: number, char: string, foreground: string, background: string) {
            if (left < 0 || this.buffW <= left) return;
            if (top  < 0 || this.buffH <= top ) return;
            const verts = new Float32Array(4 * vertexComponents);
            const fg = toPremulRGBA(foreground);
            const bg = toPremulRGBA(background);
            if (!fg) throw `Invalid foreground color: ${JSON.stringify(foreground)}`;
            if (!bg) throw `Invalid background color: ${JSON.stringify(background)}`;
            this.writeChar(
                verts, 0, left, top, char,
                fg.r + bg.r * (1-fg.a),
                fg.g + bg.g * (1-fg.a),
                fg.b + bg.b * (1-fg.a),
                bg.r,
                bg.g,
                bg.b,
            );
            const {webgl} = this;
            webgl.bindBuffer(webgl.ARRAY_BUFFER, this.vb);
            webgl.bufferSubData(webgl.ARRAY_BUFFER, 4 * 4 * vertexComponents * (left + top * this.buffW), verts);
        }

        /**
         * Render to the underlying canvas.  May fail (and return `false`) if the font hasn't been loaded yet.
         * You can simply retry on another frame if this occurs.  Will return `true` on success.
         */
        public tryRender (): boolean {
            const {canvas, webgl, ib, vb, fontTexture, buffW, buffH} = this;
            if (!fontTexture.isReady()) return false; // Not yet ready

            webgl.viewport(0, 0, canvas.width, canvas.height);
            webgl.clear(webgl.COLOR_BUFFER_BIT);
            webgl.activeTexture(webgl.TEXTURE0);
            this.program.bind(webgl, {
                uFont: fontTexture,
                uOrigin: [-1.0,+1.0],
                uScale:  [+2/buffW,-2/buffH],
            });
            webgl.bindBuffer(webgl.ARRAY_BUFFER, vb);
            webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, ib);
            webgl.enableVertexAttribArray(0);
            webgl.enableVertexAttribArray(1);
            webgl.enableVertexAttribArray(2);
            webgl.enableVertexAttribArray(3);
            // XXX: I should redo this with ArrayBuffer + DrawaView s so I can pack my RGB components etc.
            // https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
            // (see `set` calls which would also need updating)
            webgl.vertexAttribPointer(0, 2, webgl.FLOAT, false, vertexComponents * 4, 0 * 4);
            webgl.vertexAttribPointer(1, 2, webgl.FLOAT, false, vertexComponents * 4, 2 * 4);
            webgl.vertexAttribPointer(2, 3, webgl.FLOAT, false, vertexComponents * 4, 4 * 4);
            webgl.vertexAttribPointer(3, 3, webgl.FLOAT, false, vertexComponents * 4, 7 * 4);
            webgl.drawElements(webgl.TRIANGLES, 6 * buffW * buffH, webgl.UNSIGNED_SHORT, 0);

            return true;
        }

        /** @hidden */ private cellW:      number;
        /** @hidden */ private cellH:      number;
        /** @hidden */ private gridW:      number;
        /** @hidden */ private gridH:      number;
        /** @hidden */ private buffW:      number;
        /** @hidden */ private buffH:      number;

        /** @hidden */ private canvas:         HTMLCanvasElement;
        /** @hidden */ private webgl:          WebGLRenderingContext;
        /** @hidden */ private ib:             WebGLBuffer;
        /** @hidden */ private vb:             WebGLBuffer;
        /** @hidden */ private fontTexture:    Texture;
        /** @hidden */ private program:        Program<shaders.terminal.Uniforms>;

        /** @hidden */ private createBuffer (description: string, type: number, data?: ArrayBufferView | ArrayBuffer, usage?: GLenum): WebGLBuffer {
            const {webgl} = this;
            const buffer = webgl.createBuffer();
            if (!buffer) throw `WebGLTerminalCanvas:  Unable to create ${description}`;
            webgl.bindBuffer(type, buffer);
            if (!!data) webgl.bufferData(type, data, usage || webgl.STATIC_DRAW);
            return buffer;
        }

        /** @hidden */ private createIB (): WebGLBuffer {
            const nQuads = this.buffW * this.buffH;
            const nVerticies = 4 * nQuads;
            const nIndicies  = 6 * nQuads;
            const ib16 = nVerticies <= 0xFFFF;
            if (!ib16) throw `createIB:  32-bit index buffer required but not coded`; // See drawElements call, check OES_element_index_uint
            const indicies = ib16 ? new Int16Array(nIndicies) : new Int32Array(nIndicies);
            for (var iQuad=0; iQuad < nQuads; ++iQuad) {
                // Assumed quad layout:
                //      0 --- 1
                //      :   / :
                //      : /   :
                //      2 --- 3
                indicies[6 * iQuad + 0] = 4 * iQuad + 0;
                indicies[6 * iQuad + 1] = 4 * iQuad + 1;
                indicies[6 * iQuad + 2] = 4 * iQuad + 2;
                indicies[6 * iQuad + 3] = 4 * iQuad + 2;
                indicies[6 * iQuad + 4] = 4 * iQuad + 1;
                indicies[6 * iQuad + 5] = 4 * iQuad + 3;
            }
            return this.createBuffer("IB", this.webgl.ELEMENT_ARRAY_BUFFER, indicies);
        }

        /** @hidden */ private createVB (background: RGBA_PreMul): WebGLBuffer {
            const verts = new Float32Array(4 * vertexComponents * this.buffW * this.buffH);
            const {buffW, buffH} = this;
            for (let y=0; y<buffH; ++y) {
                for (let x=0; x<buffW; ++x) {
                    const quad = x + buffW * y;
                    this.writeChar(verts, quad, x, y, ' ', 1, 1, 1, background.r, background.g, background.b);
                }
            }
            return this.createBuffer("VB", this.webgl.ARRAY_BUFFER, verts);
        }

        /** @hidden */ private getUV (char: string): { u0: number, v0: number, u1: number, v1: number } {
            const charIndex = char.charCodeAt(0);
            const {gridW, gridH} = this;
            const u = (charIndex % gridW) | 0;
            const v = (charIndex / gridW) | 0;
            return { u0: (u+0)/gridW, v0: (v+0)/gridH, u1: (u+1)/gridW, v1: (v+1)/gridH };
        }

        /** @hidden */ private writeChar (
            verts: Float32Array, quad: number, x: number, y: number, char: string,
            fgR: number, fgG: number, fgB: number,
            bgR: number, bgG: number, bgB: number,
        ) {
            const {u0, v0, u1, v1} = this.getUV(char);
            let v = 4 * vertexComponents * quad;

            // Generate layout:
            //      0 --- 1
            //      :   / :
            //      : /   :
            //      2 --- 3
            for (let vv = 0; vv <= 1; ++vv) {
                for (let uu = 0; uu <= 1; ++uu) {
                    verts[v++] = (x + uu);
                    verts[v++] = (y + vv);
                    verts[v++] = uu ? u1 : u0;
                    verts[v++] = vv ? v1 : v0;
                    verts[v++] = fgR;
                    verts[v++] = fgG;
                    verts[v++] = fgB;
                    verts[v++] = bgR;
                    verts[v++] = bgG;
                    verts[v++] = bgB;
                }
            }
        }
    }
}
