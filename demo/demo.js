var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        /** @hidden */
        function createShader(description, webgl, type, source) {
            var shader = webgl.createShader(type);
            if (!shader)
                throw "Unable to create shader: " + description;
            webgl.shaderSource(shader, source);
            webgl.compileShader(shader);
            if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
                var compileErrors = webgl.getShaderInfoLog(shader);
                throw "Could not compile WebGL " + JSON.stringify(description) + ":\n\n" + compileErrors;
            }
            return shader;
        }
        /** @hidden */
        var Program = /** @class */ (function () {
            function Program(webgl, vertexShader, fragmentShader, attribs) {
                this.uniformsCache = {};
                var program = webgl.createProgram();
                if (!program)
                    throw "Unable to create shader program";
                webgl.attachShader(program, createShader("vertex shader", webgl, webgl.VERTEX_SHADER, vertexShader));
                webgl.attachShader(program, createShader("fragment shader", webgl, webgl.FRAGMENT_SHADER, fragmentShader));
                webgl.linkProgram(program);
                webgl.validateProgram(program);
                if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
                    var linkErrors = webgl.getProgramInfoLog(program);
                    throw "Couldn't compile/link WebGL program.\n\n" + linkErrors;
                }
                this.program = program;
                this.attribs = attribs;
            }
            Program.prototype.bind = function (webgl, uniforms) {
                var e_1, _a;
                var _b = this, program = _b.program, attribs = _b.attribs, uniformsCache = _b.uniformsCache;
                webgl.useProgram(program);
                for (var i = 0; i < attribs.length; ++i)
                    webgl.bindAttribLocation(program, i, attribs[i]);
                var texIndex = 0;
                try {
                    for (var _c = __values(Object.keys(uniforms)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var name_1 = _d.value;
                        var value = uniforms[name_1];
                        var location_1 = uniformsCache[name_1];
                        if (location_1 === undefined)
                            location_1 = uniformsCache[name_1] = webgl.getUniformLocation(program, name_1);
                        if (location_1 === null)
                            continue;
                        if (typeof value === 'number') {
                            webgl.uniform1f(location_1, value);
                        }
                        else if (Array.isArray(value)) {
                            var array = new Float32Array(value);
                            switch (value.length) {
                                case 1:
                                    webgl.uniform1fv(location_1, array);
                                    break;
                                case 2:
                                    webgl.uniform2fv(location_1, array);
                                    break;
                                case 3:
                                    webgl.uniform3fv(location_1, array);
                                    break;
                                case 4:
                                    webgl.uniform4fv(location_1, array);
                                    break;
                                case 9:
                                    webgl.uniformMatrix3fv(location_1, false, array);
                                    break;
                                case 16:
                                    webgl.uniformMatrix4fv(location_1, false, array);
                                    break;
                                default: throw "Invalid uniform value for " + JSON.stringify(name_1) + ": " + JSON.stringify(array);
                            }
                        }
                        else { // texture
                            value.tryBindTo(webgl, texIndex);
                            webgl.uniform1i(location_1, texIndex);
                            ++texIndex;
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_a = _c["return"])) _a.call(_c);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            };
            return Program;
        }());
        terminal.Program = Program;
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        /**
         * @hidden
         *
         * We want to strongly discorage actually storing the WebGLTexture directly anywhere, so we wrap it in this.
         * This helps accomplish the following shenannigans:
         *
         *  1) Delay loaded textures, where we create the `Texture` before the image is actually loaded.
         *  2) Hot swapping textures?
         *  3) Animation via texture swaps?
         */
        var Texture = /** @class */ (function () {
            function Texture(webgl, src) {
                this.texture = null;
                var image;
                if (typeof src === 'string') {
                    image = document.createElement("img");
                    image.src = src;
                }
                else {
                    image = src;
                }
                var self = this;
                function resolve() {
                    console.assert(image.complete);
                    var texture = self.texture = webgl.createTexture();
                    webgl.bindTexture(webgl.TEXTURE_2D, texture);
                    webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, image);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
                }
                ;
                if (image.complete)
                    resolve();
                else
                    image.addEventListener("load", resolve);
            }
            Texture.prototype.isReady = function () { return this.texture !== null; };
            /** May fail if the texture hasn't loaded yet, or errored out, or ... */
            Texture.prototype.tryBindTo = function (webgl, index) {
                if (this.texture === null)
                    return false;
                webgl.activeTexture(webgl.TEXTURE0 + index);
                webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
                return true;
            };
            return Texture;
        }());
        terminal.Texture = Texture;
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        /** @hidden */
        var vertexComponents = (+2 // Position
            + 2 // UV
            + 3 // Foreground
            + 3 // Background
        );
        /** A write-only terminal canvas that uses the 2d canvas text rendering APIs to display text. */
        var WebGLTerminalCanvas = /** @class */ (function () {
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
            function WebGLTerminalCanvas(params) {
                var font = params.font || terminal.fonts.pc_bios_8x8;
                this.cellW = font.charSize[0];
                this.cellH = font.charSize[1];
                this.gridW = font.gridSize[0];
                this.gridH = font.gridSize[1];
                this.buffW = params.bufferSize === undefined ? 80 : params.bufferSize[0];
                this.buffH = params.bufferSize === undefined ? 25 : params.bufferSize[1];
                var canvas = params.canvas;
                if (typeof canvas === 'string') {
                    canvas = document.getElementById(canvas);
                    if (!canvas)
                        throw "WebGLTerminalCanvas({ canvas: " + JSON.stringify(params.canvas) + " }): No element with that ID";
                    if (canvas.tagName.toUpperCase() !== 'CANVAS')
                        throw "WebGLTerminalCanvas({ canvas: " + JSON.stringify(params.canvas) + " }): Element is not a canvas";
                }
                if (!(canvas instanceof HTMLCanvasElement))
                    throw "WebGLTerminalCanvas({ canvas: ... }): Element is not a canvas";
                this.canvas = canvas;
                canvas.width = this.cellW * this.buffW;
                canvas.height = this.cellH * this.buffH;
                var zoom = params.zoom || 1;
                canvas.style.width = ((canvas.width * zoom) | 0) + "px";
                canvas.style.height = ((canvas.height * zoom) | 0) + "px";
                var webgl = this.webgl = canvas.getContext("webgl");
                if (!webgl)
                    throw "WebGLTerminalCanvas(...): Unable to get a WebGL context";
                var background = terminal.toPremulRGBA(params.background || '#111');
                if (background === undefined)
                    throw "WebGLTerminalCanvas({ background: " + JSON.stringify(params.background) + " }): Not a valid #RRGGBB color";
                if (background.a !== 1)
                    throw "WebGLTerminalCanvas({ background: " + JSON.stringify(params.background) + " }): Expected 100% opacity alpha";
                this.ib = this.createIB();
                this.vb = this.createVB(background);
                this.fontTexture = new terminal.Texture(webgl, font.image);
                var r = background.r, g = background.g, b = background.b, a = background.a;
                webgl.clearColor(r, g, b, 1.0);
                this.program = terminal.shaders.terminal.createProgram(webgl);
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
            WebGLTerminalCanvas.prototype.set = function (left, top, char, foreground, background) {
                if (left < 0 || this.buffW <= left)
                    return;
                if (top < 0 || this.buffH <= top)
                    return;
                var verts = new Float32Array(4 * vertexComponents);
                var fg = terminal.toPremulRGBA(foreground);
                var bg = terminal.toPremulRGBA(background);
                if (!fg)
                    throw "Invalid foreground color: " + JSON.stringify(foreground);
                if (!bg)
                    throw "Invalid background color: " + JSON.stringify(background);
                this.writeChar(verts, 0, left, top, char, fg.r + bg.r * (1 - fg.a), fg.g + bg.g * (1 - fg.a), fg.b + bg.b * (1 - fg.a), bg.r, bg.g, bg.b);
                var webgl = this.webgl;
                webgl.bindBuffer(webgl.ARRAY_BUFFER, this.vb);
                webgl.bufferSubData(webgl.ARRAY_BUFFER, 4 * 4 * vertexComponents * (left + top * this.buffW), verts);
            };
            /**
             * Render to the underlying canvas.  May fail (and return `false`) if the font hasn't been loaded yet.
             * You can simply retry on another frame if this occurs.  Will return `true` on success.
             */
            WebGLTerminalCanvas.prototype.tryRender = function () {
                var _a = this, canvas = _a.canvas, webgl = _a.webgl, ib = _a.ib, vb = _a.vb, fontTexture = _a.fontTexture, buffW = _a.buffW, buffH = _a.buffH;
                if (!fontTexture.isReady())
                    return false; // Not yet ready
                webgl.viewport(0, 0, canvas.width, canvas.height);
                webgl.clear(webgl.COLOR_BUFFER_BIT);
                webgl.activeTexture(webgl.TEXTURE0);
                this.program.bind(webgl, {
                    uFont: fontTexture,
                    uOrigin: [-1.0, +1.0],
                    uScale: [+2 / buffW, -2 / buffH]
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
            };
            /** @hidden */ WebGLTerminalCanvas.prototype.createBuffer = function (description, type, data, usage) {
                var webgl = this.webgl;
                var buffer = webgl.createBuffer();
                if (!buffer)
                    throw "WebGLTerminalCanvas:  Unable to create " + description;
                webgl.bindBuffer(type, buffer);
                if (!!data)
                    webgl.bufferData(type, data, usage || webgl.STATIC_DRAW);
                return buffer;
            };
            /** @hidden */ WebGLTerminalCanvas.prototype.createIB = function () {
                var nQuads = this.buffW * this.buffH;
                var nVerticies = 4 * nQuads;
                var nIndicies = 6 * nQuads;
                var ib16 = nVerticies <= 0xFFFF;
                if (!ib16)
                    throw "createIB:  32-bit index buffer required but not coded"; // See drawElements call, check OES_element_index_uint
                var indicies = ib16 ? new Int16Array(nIndicies) : new Int32Array(nIndicies);
                for (var iQuad = 0; iQuad < nQuads; ++iQuad) {
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
            };
            /** @hidden */ WebGLTerminalCanvas.prototype.createVB = function (background) {
                var verts = new Float32Array(4 * vertexComponents * this.buffW * this.buffH);
                var _a = this, buffW = _a.buffW, buffH = _a.buffH;
                for (var y = 0; y < buffH; ++y) {
                    for (var x = 0; x < buffW; ++x) {
                        var quad = x + buffW * y;
                        this.writeChar(verts, quad, x, y, ' ', 1, 1, 1, background.r, background.g, background.b);
                    }
                }
                return this.createBuffer("VB", this.webgl.ARRAY_BUFFER, verts);
            };
            /** @hidden */ WebGLTerminalCanvas.prototype.getUV = function (char) {
                var charIndex = char.charCodeAt(0);
                var _a = this, gridW = _a.gridW, gridH = _a.gridH;
                var u = (charIndex % gridW) | 0;
                var v = (charIndex / gridW) | 0;
                return { u0: (u + 0) / gridW, v0: (v + 0) / gridH, u1: (u + 1) / gridW, v1: (v + 1) / gridH };
            };
            /** @hidden */ WebGLTerminalCanvas.prototype.writeChar = function (verts, quad, x, y, char, fgR, fgG, fgB, bgR, bgG, bgB) {
                var _a = this.getUV(char), u0 = _a.u0, v0 = _a.v0, u1 = _a.u1, v1 = _a.v1;
                var v = 4 * vertexComponents * quad;
                // Generate layout:
                //      0 --- 1
                //      :   / :
                //      : /   :
                //      2 --- 3
                for (var vv = 0; vv <= 1; ++vv) {
                    for (var uu = 0; uu <= 1; ++uu) {
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
            };
            return WebGLTerminalCanvas;
        }());
        terminal.WebGLTerminalCanvas = WebGLTerminalCanvas;
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        /** @hidden */
        function toNoMulRGBA(color) {
            if (color === undefined)
                return undefined;
            var m = /^#([0-9a-f]+)$/i.exec(color);
            if (!m)
                return undefined;
            var c = m[1];
            switch (c.length) {
                case 3: return {
                    r: parseInt(m[1].substr(0, 1), 16) / 0xF,
                    g: parseInt(m[1].substr(1, 1), 16) / 0xF,
                    b: parseInt(m[1].substr(2, 1), 16) / 0xF,
                    a: 1
                };
                case 4: return {
                    r: parseInt(m[1].substr(0, 1), 16) / 0xF,
                    g: parseInt(m[1].substr(1, 1), 16) / 0xF,
                    b: parseInt(m[1].substr(2, 1), 16) / 0xF,
                    a: parseInt(m[1].substr(3, 1), 16) / 0xF
                };
                case 6: return {
                    r: parseInt(m[1].substr(0, 2), 16) / 0xFF,
                    g: parseInt(m[1].substr(2, 2), 16) / 0xFF,
                    b: parseInt(m[1].substr(4, 2), 16) / 0xFF,
                    a: 1
                };
                case 8: return {
                    r: parseInt(m[1].substr(0, 2), 16) / 0xFF,
                    g: parseInt(m[1].substr(2, 2), 16) / 0xFF,
                    b: parseInt(m[1].substr(4, 2), 16) / 0xFF,
                    a: parseInt(m[1].substr(6, 2), 16) / 0xFF
                };
                default: return undefined;
            }
        }
        terminal.toNoMulRGBA = toNoMulRGBA;
        /** @hidden */
        function toPremulRGBA(color) {
            var c = toNoMulRGBA(color);
            if (!c)
                return undefined;
            c.r *= c.a;
            c.g *= c.a;
            c.b *= c.a;
            return c;
        }
        terminal.toPremulRGBA = toPremulRGBA;
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        /** @hidden */
        var warnedAbout = {};
        /** @hidden */
        function warnAbout(id, reason) {
            if (warnedAbout[id])
                return;
            console.warn("#" + id + ": " + reason);
            warnedAbout[id] = true;
        }
        terminal.warnAbout = warnAbout;
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
/** @hidden */
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal) {
        var fonts;
        (function (fonts) {
            fonts.pc_bios_8x8 = {
                image: 'data:image/png;base64,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',
                charSize: [8, 8],
                gridSize: [32, 8]
            };
        })(fonts = terminal.fonts || (terminal.fonts = {}));
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
/** @hidden */
var mmk;
(function (mmk) {
    var terminal;
    (function (terminal_1) {
        var shaders;
        (function (shaders) {
            var terminal;
            (function (terminal) {
                var common = "\nvarying mediump vec2 vTexCoord;\nvarying lowp    vec3 vForeground;\nvarying lowp    vec3 vBackground;\n".trim();
                var vs = "// Terminal vertex shader\n\nattribute highp   vec2 aPosition;\nattribute mediump vec2 aTexCoord;\nattribute lowp    vec3 aForeground;\nattribute lowp    vec3 aBackground;\n" + common + "\nuniform vec2 uOrigin;\nuniform vec2 uScale;\n\nvoid main () {\n    vec2 pos = uOrigin + aPosition * uScale;\n\n    vTexCoord   = aTexCoord;\n    vForeground = aForeground;\n    vBackground = aBackground;\n    gl_Position = vec4(pos.x, pos.y, 0.0, 1.0);\n}\n";
                var fs = "// Terminal fragment shader\n\n" + common + "\nuniform sampler2D uFont;\n\nvoid main () {\n    lowp vec4 font = texture2D(uFont, vTexCoord);\n    lowp vec3 c = mix(vBackground.rgb, vForeground.rgb, font.rgb);\n    gl_FragColor = vec4(c.r, c.g, c.b, 1.0);\n}\n";
                function createProgram(webgl) {
                    return new terminal_1.Program(webgl, vs, fs, ["aPosition", "aTexCoord", "aForeground", "aBackground"]);
                }
                terminal.createProgram = createProgram;
            })(terminal = shaders.terminal || (shaders.terminal = {}));
        })(shaders = terminal_1.shaders || (terminal_1.shaders = {}));
    })(terminal = mmk.terminal || (mmk.terminal = {}));
})(mmk || (mmk = {}));
//# sourceMappingURL=global.js.map
var tables = [
    { left: 0, top: 0, fg: '#000', bg: '#FFF' },
    { left: 19, top: 0, fg: '#FFF', bg: '#000' },
    { left: 0, top: 19, fg: '#020', bg: '#6F6' },
    { left: 19, top: 19, fg: '#6F6', bg: '#020' },
    { left: 0, top: 38, fg: '#210', bg: '#FD6' },
    { left: 19, top: 38, fg: '#FD6', bg: '#210' },
];
function initAsciiTable(asciiTables) {
    var e_1, _a;
    //const bar = '|', dash = '-', cross = '+';
    //const bar = '\xB3', dash = '\xC4', cross = '\xC5';
    var bar = '\xBA', dash = '\xCD', cross = '\xCE';
    try {
        for (var tables_1 = __values(tables), tables_1_1 = tables_1.next(); !tables_1_1.done; tables_1_1 = tables_1.next()) {
            var table = tables_1_1.value;
            var fg = table.fg, bg = table.bg;
            asciiTables.set(table.left + 0, table.top + 0, ' ', fg, bg);
            asciiTables.set(table.left + 1, table.top + 0, bar, fg, bg);
            asciiTables.set(table.left + 1, table.top + 1, cross, fg, bg);
            asciiTables.set(table.left + 0, table.top + 1, dash, fg, bg);
            for (var i = 0; i < 16; ++i) {
                var hex = '0123456789ABCDEF'[i];
                asciiTables.set(table.left + 2 + i, table.top + 0, hex, fg, bg);
                asciiTables.set(table.left + 2 + i, table.top + 1, dash, fg, bg);
                asciiTables.set(table.left + 0, table.top + 2 + i, hex, fg, bg);
                asciiTables.set(table.left + 1, table.top + 2 + i, bar, fg, bg);
            }
            for (var y = 0; y < 16; ++y) {
                for (var x = 0; x < 16; ++x) {
                    var code = y * 16 + x;
                    asciiTables.set(table.left + 2 + x, table.top + 2 + y, String.fromCharCode(code), fg, bg);
                }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (tables_1_1 && !tables_1_1.done && (_a = tables_1["return"])) _a.call(tables_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
addEventListener("load", function () {
    time("ascii-tables-webgl", function () {
        var canvas = new mmk.terminal.WebGLTerminalCanvas({
            canvas: "ascii-tables",
            bufferSize: [2 * 19 + 1, 3 * 19 + 1],
            background: '#FFF',
            zoom: 2
        });
        initAsciiTable(canvas);
        eachFrame(function () { return canvas.tryRender(); });
    });
});
var e_2, _a;
var ref = "\n\n\n\n\n#057                  #_   _#  _'_  #   # #     ''#'' #_  # _'''_\n#0AC                  # '_' # #___# #   # #       #   # '_# #    \n#4DF                  #     # #   # #   # #       #   #   # # ''#\n#FFF                  #     # #   # '___' #____ __#__ #   # '___'\n\n\n#402                      #_ _# _'''_ #_  # #  _' #'''' '_ _'      \n#814                      # ' # #   # # '_# #_'   #___    #        \n#F0A                      #   # #   # #   # # '_  #       #        \n#F9C                      #   # '___' #   # #   # #____   #        \n\n\n#FFF                  NPM  -+-  @maulingmonkey/terminal\n#DDD                  GIT  -+-  github.com/MaulingMonkey/mmk.terminal\n#999                 DEMO  -+-  maulingmonkey.com/mmk.terminal/demo/\n#666              LICENSE  -+-  Apache 2.0\n\n\n\n#BB0                                                                          \u00EA         Yellow omegas are ZZT monkeys, right?\n";
var lines = [];
try {
    for (var _b = __values(ref.split('\n')), _c = _b.next(); !_c.done; _c = _b.next()) {
        var line = _c.value;
        var m = /^(#[0-9a-f]+)(.*)$/i.exec(line);
        lines.push({
            text: m ? m[2] : line,
            foreground: m ? m[1] : '#FFF',
            background: '#000'
        });
    }
}
catch (e_2_1) { e_2 = { error: e_2_1 }; }
finally {
    try {
        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
    }
    finally { if (e_2) throw e_2.error; }
}
var remap = {
    '#': { text: '\xDB' },
    '\'': { text: '\xDF' },
    '_': { text: '\xDC' },
    '-': { text: '\xC4' },
    '+': { text: '\xD7' }
};
addEventListener("load", function () {
    var c = new mmk.terminal.WebGLTerminalCanvas({ canvas: "block-art", background: '#000' });
    function render() {
        requestAnimationFrame(render);
        for (var y = 0; y < lines.length; ++y) {
            var line = lines[y];
            for (var x = 0; x < line.text.length; ++x) {
                var text = line.text[x];
                var r = remap[text] || {};
                c.set(x, y, r.text || text, r.foreground || line.foreground, r.background || line.background);
            }
        }
        c.tryRender();
    }
    time("First render", render);
});
function eachFrame(action) {
    setInterval(action, 10); // XXX
}
function time(label, action) {
    var start = Date.now();
    action();
    var stop = Date.now();
    console.log(label + ": " + (stop - start).toString() + "ms");
}
//# sourceMappingURL=demo.js.map