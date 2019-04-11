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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
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
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABACAMAAADCg1mMAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAMAUExURQAAAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGd27GMAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNv1OCegAAAiuSURBVHhe7VXZcuTIDdz9/5828gJQxaZGUoz95Jwu5IUiuxWxsf80/iU248OGE4WFSNB6qtOLtyslUqGz4MVMnV4nDeJu/h36IScUdQPx9gfIVJqSktYimgpDq4C0noOWG+ujMPBec5eXDcquArcAJkC9gaMifgxvcsPbYezZYYj5FBwtTC5HL1Yri+UoEpmnP3W0Z8yeWDcICrsjdCEpqCxYOW4kaJbIKqa0fzL+IfcFspc4WqMUEZG9wZkdCH02Yg/mU7gbTilYJFAJqMGg8yIlmZS4C256n3w8J13vNCHjguDCamar/niNnXi24rM3OqKO1mS6A1Q7nYFGjAYiDCWrIV7PkcieErtcijQ6Xlmh3Nrs3sRedHtNAkofoxcCG9e5QUx1sMDlghRmUmvIEhyyKvir+AdbyAWSDqcy5zJpn/xL5MHhG4nDBm3BdjyHI+VjwJJ2B7JyYp5HwAK2fwN+WBFVOHnDb53489p3gDv9M/yAsXkiBWwXmiMck58487jHfoKaFMMskq28BhBhBp0LrzhW5/XHYdGatunTyXxyMFtno/cwVUn0kjIpUPIRUbw29h1cwLie2CoxGE89t6Tvk9nc5AfMwgjhaZn0PS/AJgFGU2F9oAK4fS7WdJE2a5NOw3RbBWEXG19kd3V6Pu/Y7JlYGGOVa8fWE3ubugMSAIkeK+OzMlNq+MAzdPJxe6F6rPTrZUILceZeuPKG/LQlaCbf51OmfKbURRfzd1hhfsBVlN0XODHwGEXBWviEu/A6dcFfjLSYYjbGh0uYOqdP3jyCeIn/e/hfvefGt9+LvyB3M8eDY8mlwtPr2AJUKRNz0o/xHPGF/3QwNuv0hVSCPZTI6K0sSB8H5HGyO0aeAFUKx3h6TnLQ1p88VfR1MDbnjLAWrPw7g3KVzAMiqIEUyOzB6VNPYlUjrIwgH51P5HgYQMLxcSJ2llgDuETNTgB6hyzgooEYxc3pYVMwKHjhiLlWmh+xOsWWWRTjntPu1+mHYILIqjOBI59hlOZVjC7p1cczswcr0h7OnlQ1wjVok+WeTQlSv78j8szzELPGNMwF2cK1cOK4Bh2xDsjDbO9O0UyqCJ9k4UMD/jm7m6BjjBAPQgaepJzgWLjRD8xx4CKWXIqDiIeyTSxiAQvtsNkbmCCAymMKMyhBzxrhOpZEe+H2/0f+UPqbKRKUHbii046bGKrzDw/8IX57P28mHd/n/Eqnuy1wRPf9D/tE528L38Vv799fQFSz/zCchTS9QcRTcjx6ahO9Yb/EWDzGQdoIPmj7zZ8OxmYd7XtjifaG1zaY+AE5t5cbjyACORCrJJOg2ydieRpqQgrzOn1pZf3/KTzmwhmVOVfw9XTzKG3rrH7lpxBsHYh4vSTcPhG3r0PrdMU5BBtNnczhiPYE3Y6gO6wTvw8RMe93pmLbSWST7VMjzwljnZCsWQztvokKdQda13/ddEu0J3q3gev5qFTtPD4x4LiF+vccI3FyGUFdYotswFI5tr2iOn1xeJmAa1f2I7xe/+Fj1/oPb57A5d/dfl5UgLwEtE62Wggve/EI7nwNIJUxF444eMkVqvRCEzg5NpS7uU8gvZPgzN73BDZHnS/wcqdiNM9TQ/VHb7khXzM7+3RjM6gnp6eIf+Mv9kAt4ovSAFinlyhw5ReYu+t5DrqePpTgPoRF/OZjp06ynMwRK8XwF0oLJGaj+WBVzxNxZIylwMpBiOSbVXqhiwRjJ8ZOPF5Maj42FqmfL8pgFcl/eiKODLgE55ItMHIIm53vU4Mk09S81LHBWYO/1Tr5b04NPYfizvkeBrbspCgFW+WaE5gezI3sDT346jPAOl0YlPIVf+T0Skou6lSeWy5W6I8Si5/it/f+LvD1X77Hlcty4sq6Zvn6IKLa2Tv2P1+7dzt6gBU+/FdL+sz+xalvJL/7R360nzC/rBg/4bhQjkH4BceOFr0O0kN5kPDoHyoe1cDF7KlOJL/7R360sInP/AJabtQ42PMG0n0aj8KnHod/FenjNoyvKZ9aSE6y0of4nOPihhLnXsDQifdzjoSEqbTkMKUYH29iUFgx4/G/SpR67cFcoDLGUa3+4M6TGviaK8f8fLJ3ItnupHWLRzcfsRKf2urf70Ijl4fR0IdXzmvOw5KL1/Oww7Pny1k3GZjmBNSr0KbihK7y8/P7WfGoBi5mv/gtD7/CLb4LpObJpVTNeYBbT5z3uPJxr2KdehX+1ZI+s3/xqpW85OFXfN3+Dczf5v1d/Ko8/sfvzfX7spkLi9/y8Cu6jbjX37y5iCocfNs7vfvg3rvx6I89/PEBW3rL7gB5xucDCm/eXEQVDr7tnd59cO/dePTHnn9fR7cO5BmfDyi8eV+sw4RMHyyZvQMf+o70CkA5hfKwoZ5hQcHAcUe3DuQZnw8ovHlzEdUVP/CWB3nOjc7TXltf9/59Hd06uH3jTzkIKmvxG+k/5X/CPFdiv/cVtZS9T1CtBcuPmAeJgysvOjbe/Fv+gNPv9r3nvOH2CdXqLD8i7ccHDxcdG2/+LX/A6Xf73nPecPuEanWWH5H244OHi46NN/+WP+D0u33vOW+4fUK1Oss/gze/WJ8+a+ERDQazfta2k7bqG3akxvM1AV/BIcPwFV4EQYj1Rz6uJkiZdlklzhfSR+vwNVM8GILaQVN/OScPMJ/+Zc0PQrtPMg0y0Av8qDdpjOmpDbNCldGAa8mZQCmaSQoMnR7Fwtlnq98jsK8AsfcFFha3XUUs75dYISwkP8OQWfEaArpPfAazH7Q944IvNAvXfZj0OUQJagexnKPabrMzWb40TICjBbsJ9+pmwU9cOPa6HiYtIbCvALH3BRbyPiAILSqWt6Mw59TQxjC2u0/8BVjX8JqI/qt7c+HC/T7YtdylM6wz01wLUQlmjapGbwLtsreiAtaVncxKY9tvoO9/D99/rIXB7/mNuz/6Mid09Wc/B/jGjX/++Q8j1hbFqaCqlgAAAABJRU5ErkJggg==',
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
var demos;
(function (demos) {
    var ascii_tables;
    (function (ascii_tables) {
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
    })(ascii_tables = demos.ascii_tables || (demos.ascii_tables = {}));
})(demos || (demos = {}));
var demos;
(function (demos) {
    var block_art;
    (function (block_art) {
        var e_2, _a;
        var ref = "\n\n\n\n\n#057                  #_   _#  _'_  #   # #     ''#'' #_  # _'''_\n#0AC                  # '_' # #___# #   # #       #   # '_# #    \n#4DF                  #     # #   # #   # #       #   #   # # ''#\n#FFF                  #     # #   # '___' #____ __#__ #   # '___'\n\n\n#402                      #_ _# _'''_ #_  # #  _' #'''' '_ _'      \n#814                      # ' # #   # # '_# #_'   #___    #        \n#F0A                      #   # #   # #   # # '_  #       #        \n#F9C                      #   # '___' #   # #   # #____   #        \n\n\n#FFF                  NPM  -+-  @maulingmonkey/terminal\n#DDD                  GIT  -+-  github.com/MaulingMonkey/mmk.terminal\n#999                 DEMO  -+-  maulingmonkey.com/mmk.terminal/demo/\n#666              LICENSE  -+-  Apache 2.0\n\n\n\n#BB0                                                                          \u00EA         Yellow omegas are ZZT monkeys, right?\n";
        var lines = [];
        try {
            for (var _b = __values(ref.split('\n')), _c = _b.next(); !_c.done; _c = _b.next()) {
                var line = _c.value;
                var m = /^(#[0-9a-f]+)($|[ ].*$)/i.exec(line);
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
            time("block-art:  First blit + render", render);
        });
    })(block_art = demos.block_art || (demos.block_art = {}));
})(demos || (demos = {}));
var demos;
(function (demos) {
    var rl_maze;
    (function (rl_maze) {
        var mazeArt = "\n        ########################################\n        #          #B           #              #\n        # ### ################# ############## #\n        #   # # # # #         # #            # #\n        # # # # # # # ### ### # # ####### ## # #\n        # # # # #   # #     # # # #     #  # # #\n        ### # # # # # ####### # # ##### # ## # #\n        #   # #   # # #     # # #       # #  # #\n        # ######### # ##### # # ####### # #### #\n        # #                 #         # #      #\n        # # ########################### ########\n        # # # #        #                       #\n        # # # # ######## ##################### #\n        # # # # #        #                   # #\n        # # # # # ######## ################# # #\n        # # # #   #        #        #        # #\n        # # # ### # ###### ######## # ######## #\n        # # #   # #   # #  #      # #          #\n        #   ### # # # # # ### ### # # ######## #\n        # # #   # # # # #   # # # # #    # #   #\n        ### # # # # ### # ### # # # # ## # # ###\n        # #   # # #     #       # # # #    # # #\n        # # ##### ##### ########### # ###### # #\n        #         #                 #@#        #\n        ########################################\n    ".trim().split('\n').map(function (l) { return l.trim(); });
        var playerPos = [1, 1];
        var maze = [];
        var mazeWidth = Math.max.apply(Math, __spread(mazeArt.map(function (l) { return l.length; })));
        var mazeHeight = mazeArt.length;
        var canvas;
        //console.assert(mazeWidth === 80);
        console.assert(mazeHeight === 25);
        var mazeArtRemap = {
            "#": { text: "\xDB", fg: '#888', bg: '#222', passable: false },
            //"#": { text: "\xB2", fg: '#AAA', bg: '#666', passable: false, },
            " ": { text: "\xF9", fg: '#444', bg: '#222', passable: true },
            "B": { text: "\xF5", fg: '#FF0', bg: '#222', passable: true },
            "@": function (xy) {
                playerPos = xy;
                return { text: "\xFE", fg: '#444', bg: '#222', passable: true };
            }
        };
        for (var y = 0; y < mazeArt.length; ++y) {
            var line = mazeArt[y];
            var mazeCells = [];
            for (var x = 0; x < line.length; ++x) {
                var ch = line[x];
                var remapped = mazeArtRemap[ch];
                if (!remapped) {
                    mazeCells.push({ text: ch, fg: '#000', bg: '#F0F', passable: true });
                }
                else if (typeof remapped === 'function') {
                    mazeCells.push(remapped([x, y]));
                }
                else { // `Cell`
                    mazeCells.push(remapped);
                }
            }
            maze.push(mazeCells);
        }
        function cellAt(pos) {
            var _a = __read(pos, 2), x = _a[0], y = _a[1];
            if (x < 0 || y < 0)
                return undefined;
            if (y >= maze.length || x >= maze[y].length)
                return undefined;
            return maze[y][x];
        }
        function refreshCell(pos) {
            if (!canvas)
                return;
            var _a = __read(pos, 2), cx = _a[0], cy = _a[1];
            var _b = __read(playerPos, 2), px = _b[0], py = _b[1];
            var cell = cellAt(pos);
            if (cx === px && cy === py) {
                canvas.set(cx, cy, '\x01', '#FFF', '#000');
            }
            else if (cell) {
                canvas.set(cx, cy, cell.text, cell.fg, cell.bg);
            }
            else {
                canvas.set(cx, cy, ' ', '#FFF', '#000');
            }
        }
        function tryMovePlayer(ev, dx, dy) {
            if (ev.type === "keydown") {
                if (ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey)
                    return;
                var _a = __read(playerPos, 2), x = _a[0], y = _a[1];
                var targetPos = [x + dx, y + dy];
                var targetCell = cellAt(targetPos);
                if (targetCell && targetCell.passable) {
                    var originalPos = playerPos;
                    playerPos = targetPos;
                    refreshCell(originalPos);
                    refreshCell(targetPos);
                }
                ev.preventDefault();
            }
        }
        addEventListener("keydown", function (ev) {
            console.log(ev);
            var Key = mmk.keyboard.Key;
            switch (ev.mmkCode || ev.mmkKey) {
                case Key.ArrowLeft:
                    tryMovePlayer(ev, -1, 0);
                    break;
                case Key.ArrowRight:
                    tryMovePlayer(ev, +1, 0);
                    break;
                case Key.ArrowUp:
                    tryMovePlayer(ev, 0, -1);
                    break;
                case Key.ArrowDown:
                    tryMovePlayer(ev, 0, +1);
                    break;
                case Key.NumpadEnd:
                case Key.Numpad1:
                    tryMovePlayer(ev, -1, +1);
                    break;
                case Key.NumpadDown:
                case Key.Numpad2:
                    tryMovePlayer(ev, 0, +1);
                    break;
                case Key.NumpadPageDown:
                case Key.Numpad3:
                    tryMovePlayer(ev, +1, +1);
                    break;
                case Key.NumpadLeft:
                case Key.Numpad4:
                    tryMovePlayer(ev, -1, 0);
                    break;
                case Key.NumpadClear:
                case Key.Numpad5:
                    tryMovePlayer(ev, 0, 0);
                    break;
                case Key.NumpadRight:
                case Key.Numpad6:
                    tryMovePlayer(ev, +1, 0);
                    break;
                case Key.NumpadHome:
                case Key.Numpad7:
                    tryMovePlayer(ev, -1, -1);
                    break;
                case Key.NumpadUp:
                case Key.Numpad8:
                    tryMovePlayer(ev, 0, -1);
                    break;
                case Key.NumpadPageUp:
                case Key.Numpad9:
                    tryMovePlayer(ev, +1, -1);
                    break;
            }
        });
        addEventListener("load", function () {
            canvas = new mmk.terminal.WebGLTerminalCanvas({
                canvas: "rl-maze",
                bufferSize: [mazeWidth, mazeHeight],
                background: '#000',
                zoom: 2
            });
            for (var y = 0; y < mazeHeight; ++y)
                for (var x = 0; x < mazeWidth; ++x)
                    refreshCell([x, y]);
            eachFrame(function () {
                canvas.tryRender();
            });
        });
    })(rl_maze = demos.rl_maze || (demos.rl_maze = {}));
})(demos || (demos = {}));
function eachFrame(action) {
    setInterval(action, 10); // XXX
}
function time(label, action) {
    var start = Date.now();
    action();
    var stop = Date.now();
    console.log(label + ": " + (stop - start).toString() + "ms");
}
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
        return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
            ar.push(r.value);
    }
    catch (error) {
        e = { error: error };
    }
    finally {
        try {
            if (r && !r.done && (m = i["return"]))
                m.call(i);
        }
        finally {
            if (e)
                throw e.error;
        }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
};
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/**
 * Constants for all legal `mmkKey` / `mmkCode` values.  By using these values instead of string literals, you can avoid
 * some typos causing match failures.  This is also used for normalization - e.g. `Key.Left === "ArrowLeft"`, not
 * `"Left"`, since `mmk.keyboard` remaps `"Left"` to `"ArrowLeft"` for consistency across multiple browsers (some of
 * which use the former, some of which use the latter.)
 */
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        var Key;
        (function (Key) {
            var self = Key;
            // Function row
            Key.Escape = "Escape";
            Key.Esc = "Escape";
            Key.F1 = "F1";
            Key.F2 = "F2";
            Key.F3 = "F3";
            Key.F4 = "F4";
            Key.F5 = "F5";
            Key.F6 = "F6";
            Key.F7 = "F7";
            Key.F8 = "F8";
            Key.F9 = "F9";
            Key.F10 = "F10";
            Key.F11 = "F11";
            Key.F12 = "F12";
            Key.Pause = "Pause";
            Key.PrintScreen = "PrintScreen";
            Key.ScrollLock = "ScrollLock";
            // Digits Row
            Key.Backquote = "Backquote";
            self["`"] = "Backquote";
            Key.Digit0 = "Digit0";
            Key.D0 = "Digit0";
            self["0"] = "Digit0";
            Key.Digit1 = "Digit1";
            Key.D1 = "Digit1";
            self["1"] = "Digit1";
            Key.Digit2 = "Digit2";
            Key.D2 = "Digit2";
            self["2"] = "Digit2";
            Key.Digit3 = "Digit3";
            Key.D3 = "Digit3";
            self["3"] = "Digit3";
            Key.Digit4 = "Digit4";
            Key.D4 = "Digit4";
            self["4"] = "Digit4";
            Key.Digit5 = "Digit5";
            Key.D5 = "Digit5";
            self["5"] = "Digit5";
            Key.Digit6 = "Digit6";
            Key.D6 = "Digit6";
            self["6"] = "Digit6";
            Key.Digit7 = "Digit7";
            Key.D7 = "Digit7";
            self["7"] = "Digit7";
            Key.Digit8 = "Digit8";
            Key.D8 = "Digit8";
            self["8"] = "Digit8";
            Key.Digit9 = "Digit9";
            Key.D9 = "Digit9";
            self["9"] = "Digit9";
            Key.Minus = "Minus";
            self["-"] = "Minus";
            Key.Equal = "Equal";
            self["="] = "Equal";
            Key.Backspace = "Backspace";
            // (Semi-)central alpha region
            Key.Tab = "Tab";
            Key.CapsLock = "CapsLock";
            Key.Caps = "CapsLock";
            Key.A = "KeyA";
            Key.B = "KeyB";
            Key.C = "KeyC";
            Key.D = "KeyD";
            Key.E = "KeyE";
            Key.F = "KeyF";
            Key.G = "KeyG";
            Key.H = "KeyH";
            Key.I = "KeyI";
            Key.J = "KeyJ";
            Key.K = "KeyK";
            Key.L = "KeyL";
            Key.M = "KeyM";
            Key.N = "KeyN";
            Key.O = "KeyO";
            Key.P = "KeyP";
            Key.Q = "KeyQ";
            Key.R = "KeyR";
            Key.S = "KeyS";
            Key.T = "KeyT";
            Key.U = "KeyU";
            Key.V = "KeyV";
            Key.W = "KeyW";
            Key.X = "KeyX";
            Key.Y = "KeyY";
            Key.Z = "KeyZ";
            Key.KeyA = "KeyA";
            Key.KeyB = "KeyB";
            Key.KeyC = "KeyC";
            Key.KeyD = "KeyD";
            Key.KeyE = "KeyE";
            Key.KeyF = "KeyF";
            Key.KeyG = "KeyG";
            Key.KeyH = "KeyH";
            Key.KeyI = "KeyI";
            Key.KeyJ = "KeyJ";
            Key.KeyK = "KeyK";
            Key.KeyL = "KeyL";
            Key.KeyM = "KeyM";
            Key.KeyN = "KeyN";
            Key.KeyO = "KeyO";
            Key.KeyP = "KeyP";
            Key.KeyQ = "KeyQ";
            Key.KeyR = "KeyR";
            Key.KeyS = "KeyS";
            Key.KeyT = "KeyT";
            Key.KeyU = "KeyU";
            Key.KeyV = "KeyV";
            Key.KeyW = "KeyW";
            Key.KeyX = "KeyX";
            Key.KeyY = "KeyY";
            Key.KeyZ = "KeyZ";
            Key.BracketLeft = "BracketLeft";
            self["["] = "BracketLeft";
            Key.BracketRight = "BracketRight";
            self["]"] = "BracketRight";
            Key.Backslash = "Backslash";
            self["\\"] = "Backslash";
            Key.Semicolon = "Semicolon";
            self[";"] = "Semicolon";
            Key.Quote = "Quote";
            self["'"] = "Quote";
            Key.Comma = "Comma";
            self[","] = "Comma";
            Key.Period = "Period";
            self["."] = "Period";
            Key.Slash = "Slash";
            self["/"] = "Slash";
            Key.Enter = "Enter";
            // Alpha edges and other control keys
            Key.ControlLeft = "ControlLeft";
            Key.CtrlLeft = "ControlLeft";
            Key.LCtrl = "ControlLeft";
            Key.ControlRight = "ControlRight";
            Key.CtrlRight = "ControlRight";
            Key.RCtrl = "ControlRight";
            Key.AltLeft = "AltLeft";
            Key.LAlt = "AltLeft";
            Key.MenuLeft = "AltLeft";
            Key.LMenu = "AltLeft";
            Key.AltRight = "AltRight";
            Key.RAlt = "AltRight";
            Key.MenuRight = "AltRight";
            Key.RMenu = "AltRight";
            Key.ShiftLeft = "ShiftLeft";
            Key.LShift = "ShiftLeft";
            Key.ShiftRight = "ShiftRight";
            Key.RShift = "ShiftRight";
            Key.MetaLeft = "MetaLeft";
            Key.LMeta = "MetaLeft";
            Key.WinLeft = "MetaLeft";
            Key.LWin = "MetaLeft";
            Key.OSLeft = "MetaLeft";
            Key.MetaRight = "MetaRight";
            Key.RMeta = "MetaRight";
            Key.WinRight = "MetaRight";
            Key.RWin = "MetaRight";
            Key.OSRight = "MetaRight";
            Key.ContextMenu = "ContextMenu";
            Key.Space = "Space";
            // 6-key Area
            Key.Insert = "Insert";
            Key.Ins = "Insert";
            Key.Delete = "Delete";
            Key.Del = "Delete";
            Key.Home = "Home";
            Key.End = "End";
            Key.PageUp = "PageUp";
            Key.PgUp = "PageUp";
            Key.PageDown = "PageDown";
            Key.PgDown = "PageDown";
            Key.ArrowLeft = "ArrowLeft";
            Key.Left = "ArrowLeft";
            Key.ArrowRight = "ArrowRight";
            Key.Right = "ArrowRight";
            Key.ArrowUp = "ArrowUp";
            Key.Up = "ArrowUp";
            Key.ArrowDown = "ArrowDown";
            Key.Down = "ArrowDown";
            // Numpad Common
            Key.NumLock = "NumLock";
            Key.NumpadAdd = "NumpadAdd";
            Key.NumpadSubtract = "NumpadSubtract";
            Key.NumpadDivide = "NumpadDivide";
            Key.NumpadMultiply = "NumpadMultiply";
            Key.NumpadEnter = "NumpadEnter";
            // Numpad w/ NumLock ON
            Key.Numpad0 = "Numpad0";
            Key.Num0 = "Numpad0";
            Key.Numpad1 = "Numpad1";
            Key.Num1 = "Numpad1";
            Key.Numpad2 = "Numpad2";
            Key.Num2 = "Numpad2";
            Key.Numpad3 = "Numpad3";
            Key.Num3 = "Numpad3";
            Key.Numpad4 = "Numpad4";
            Key.Num4 = "Numpad4";
            Key.Numpad5 = "Numpad5";
            Key.Num5 = "Numpad5";
            Key.Numpad6 = "Numpad6";
            Key.Num6 = "Numpad6";
            Key.Numpad7 = "Numpad7";
            Key.Num7 = "Numpad7";
            Key.Numpad8 = "Numpad8";
            Key.Num8 = "Numpad8";
            Key.Numpad9 = "Numpad9";
            Key.Num9 = "Numpad9";
            Key.NumpadDecimal = "NumpadDecimal";
            // Numpad w/ NumLock OFF (or with Shift held without 'fixing' that behavior)
            Key.NumpadFunc0 = "NumpadInsert";
            Key.NumpadFunc1 = "NumpadEnd";
            Key.NumpadFunc2 = "NumpadDown";
            Key.NumpadFunc3 = "NumpadPageDown";
            Key.NumpadFunc4 = "NumpadLeft";
            Key.NumpadFunc5 = "NumpadClear";
            Key.NumpadFunc6 = "NumpadRight";
            Key.NumpadFunc7 = "NumpadHome";
            Key.NumpadFunc8 = "NumpadUp";
            Key.NumpadFunc9 = "NumpadPageUp";
            Key.NumpadFuncDecimal = "NumpadDelete";
            Key.NumpadInsert = "NumpadInsert";
            Key.NumpadEnd = "NumpadEnd";
            Key.NumpadDown = "NumpadDown";
            Key.NumpadPageDown = "NumpadPageDown";
            Key.NumpadLeft = "NumpadLeft";
            Key.NumpadClear = "NumpadClear";
            Key.NumpadRight = "NumpadRight";
            Key.NumpadHome = "NumpadHome";
            Key.NumpadUp = "NumpadUp";
            Key.NumpadPageUp = "NumpadPageUp";
            Key.NumpadDelete = "NumpadDelete";
        })(Key = keyboard.Key || (keyboard.Key = {}));
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard.Key
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        /**
         * Parse a human-readable string like `"Ctrl+Shift+B"` and turn it into a [[SimpleKeyCombo]], asserting if it fails.
         * Use [[tryParseSimpleKeyCombo]] instead if you're parsing user input, which will return `undefined` if it fails.
         * The behavior of any unspecified keys on matching the combination is controlled by `modifierDefaults`.
         * `modifierDefaults` defaults to all false, which means e.g. `"Ctrl+Shift+B"` won't match `Ctrl+Alt+Shift+B`.
         *
         * Additionally, you can use `?` to ignore a modifier (e.g. `"?Ctrl+Shift+B"` will ignore if `Ctrl` is held or not),
         * or use `!` to specify a modifier *cannot* be held (e.g. `"!Ctrl+Shift+B"` demands `Ctrl` is not held, ignoring
         * `modifierDefaults.ctrl`)
         */
        function parseSimpleKeyCombo(desc, modifierDefaults) {
            if (modifierDefaults === void 0) {
                modifierDefaults = { alt: false, shift: false, ctrl: false, meta: false };
            }
            var r = tryParseSimpleKeyCombo(desc, modifierDefaults);
            console.assert(!!r, "parseSimpleKeyCombo failed to parse key combination:", desc);
            return r;
        }
        keyboard.parseSimpleKeyCombo = parseSimpleKeyCombo;
        /**
         * Parse a human-readable string like `"Ctrl+Shift+B"` and turn it into a [[SimpleKeyCombo]], or returns `undefined`.
         * Use [[parseSimpleKeyCombo]] instead if you're parsing hardcoded strings, which will assert if it fails.
         * The behavior of any unspecified keys on matching the combination is controlled by `modifierDefaults`.
         * `modifierDefaults` defaults to all false, which means e.g. `"Ctrl+Shift+B"` won't match `Ctrl+Alt+Shift+B`.
         *
         * Additionally, you can use `?` to ignore a modifier (e.g. `"?Ctrl+Shift+B"` will ignore if `Ctrl` is held or not),
         * or use `!` to specify a modifier *cannot* be held (e.g. `"!Ctrl+Shift+B"` demands `Ctrl` is not held, ignoring
         * `modifierDefaults.ctrl`)
         */
        function tryParseSimpleKeyCombo(description, modifierDefaults) {
            if (modifierDefaults === void 0) {
                modifierDefaults = { alt: false, shift: false, ctrl: false, meta: false };
            }
            if (description === undefined || description === null || description === "")
                return undefined;
            var skc = {
                mmkCode: undefined,
                mmkKey: undefined,
                alt: modifierDefaults.alt,
                shift: modifierDefaults.shift,
                ctrl: modifierDefaults.ctrl,
                meta: modifierDefaults.meta
            };
            var remaining = description;
            while (remaining.length > 0) {
                var nextSplit = remaining.indexOf('+', 1);
                var fragment = nextSplit === -1 ? remaining : remaining.substr(0, nextSplit); // Everything before "+"
                remaining = nextSplit === -1 ? "" : remaining.substr(nextSplit + 1); // Everything after (skipping) "+"
                if ((nextSplit !== -1) && (remaining.length === 0)) {
                    console.warn("Malformed simple key combo ends with combining '+':", description);
                    return undefined;
                }
                console.assert(fragment.length > 0, "BUG: Should be impossible to reach with fragment.length === 0");
                var firstChar = fragment[0];
                var modVal = firstChar === '!' ? false : firstChar === '?' ? undefined : true;
                switch (fragment.replace(/^[!?]/, "").toLowerCase()) {
                    case "control":
                    case "ctrl":
                    case "ctl":
                        skc.ctrl = modVal;
                        break;
                    case "shift":
                    case "shft":
                        skc.shift = modVal;
                        break;
                    case "alt":
                        skc.alt = modVal;
                        break;
                    case "meta":
                    case "win":
                    case "os":
                        skc.meta = modVal;
                        break;
                    default:
                        if (remaining.length > 0) {
                            console.warn("Unrecognized modifier key, or unexpected non-modifier mid-combination in:", description);
                            return undefined;
                        }
                        var scanMatch = /^\[(.+)\]$/.exec(fragment);
                        if (scanMatch)
                            fragment = scanMatch[1];
                        var keys = Object.keys(keyboard.Key);
                        var i = keys.indexOf(fragment);
                        if (i === -1) {
                            console.warn("Unrecognized key:", fragment);
                            return undefined;
                        }
                        var key = keyboard.Key[fragment]; // Normalize
                        if (scanMatch)
                            skc.mmkCode = key;
                        else
                            skc.mmkKey = key;
                        break;
                }
            }
            return skc;
        }
        keyboard.tryParseSimpleKeyCombo = tryParseSimpleKeyCombo;
        /**
         * Returns true if a given [[KeyboardEvent]] matches a given [[SimpleKeyCombo]]
         */
        function isSimpleKeyCombo(event, skc) {
            if (skc.mmkCode !== undefined && event.mmkCode !== skc.mmkCode)
                return false;
            if (skc.mmkKey !== undefined && event.mmkKey !== skc.mmkKey)
                return false;
            if (skc.ctrl !== undefined && event.ctrlKey !== skc.ctrl)
                return false;
            if (skc.shift !== undefined && event.shiftKey !== skc.shift)
                return false;
            if (skc.alt !== undefined && event.altKey !== skc.alt)
                return false;
            if (skc.meta !== undefined && event.metaKey !== skc.meta)
                return false;
            return true;
        }
        keyboard.isSimpleKeyCombo = isSimpleKeyCombo;
        /** @hidden */
        function equalSimpleKeyCombo(l, r) {
            return (l.mmkCode === r.mmkCode) &&
                (l.mmkKey === r.mmkKey) &&
                (l.ctrl === r.ctrl) &&
                (l.shift === r.shift) &&
                (l.alt === r.alt) &&
                (l.meta === r.meta);
        }
        // ~ Unit testing
        /** @hidden */
        function testEqual(L, R) { var Lskc = parseSimpleKeyCombo(L); var Rskc = parseSimpleKeyCombo(R); var eq = equalSimpleKeyCombo(Lskc, Rskc); console.assert(eq, "Expected:", L, "(", Lskc, ") ===", R, "(", Rskc, ")"); }
        /** @hidden */
        function testNotEqual(L, R) { var Lskc = parseSimpleKeyCombo(L); var Rskc = parseSimpleKeyCombo(R); var eq = equalSimpleKeyCombo(Lskc, Rskc); console.assert(!eq, "Expected:", L, "(", Lskc, ") !==", R, "(", Rskc, ")"); }
        testEqual("Ctrl+Alt+Del", "Control+Alt+Delete");
        testNotEqual("Ctrl+Alt+Del", "Control+Alt+Ins");
        testEqual("!Ctrl+!Alt+!Shift+Delete", "Delete");
        testNotEqual("Delete", "Ctrl+Delete");
        testNotEqual("Delete", "Alt+Delete");
        testNotEqual("Delete", "Shift+Delete");
        testNotEqual("Delete", "Meta+Delete");
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/** Configuration flags and settings for how mmk.keyboard as a whole behaves. */
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        var config;
        (function (config) {
            /** Master control for all per-event debugging options. */
            config.debugEvents = false;
            /** Should events where `event.mmkRepeat === true` be ignored for debugging purpouses? */
            config.debugIgnoreRepeat = false;
            /** Should events be logged to the console? */
            config.debugLog = true;
            /** When logging, should only `keydown` events be logged?  Or should `keypress` / `keyup` events be logged as well? */
            config.debugLogOnlyDown = true;
            /** When logging, should `event.mmk___` fields be logged? */
            config.debugLogBaked = true;
            /** When logging, should `event.___` fields of the original event be logged? */
            config.debugLogRaw = true;
            /** When logging, should `event.___Key` fields be logged? */
            config.debugLogMods = true;
            /** When logging, should the event object as a whole be logged? */
            config.debugLogOriginalEvent = false;
            config.debugAssertKeyDefined = true;
        })(config = keyboard.config || (keyboard.config = {}));
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard.config
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        // Note that this is currently very incomplete.
        // I also don't expose it in any useable fashion yet.
        /** @hidden - https://en.wikipedia.org/wiki/Table_of_keyboard_shortcuts */
        var ReservedCombinations = [
            // 6-key region
            { keys: "Ctrl+Alt+Ins", origin: "Media", action: "Play / Restart" },
            { keys: "Ctrl+Alt+Del", origin: "System", action: "Close program, secure attention, login, etc." },
            { keys: "Ctrl+Alt+Home", origin: "Media", action: "Pause" },
            { keys: "Ctrl+Alt+End", origin: "Media", action: "Stop" },
            { keys: "Ctrl+Alt+PageUp", origin: "Media", action: "Prev track" },
            { keys: "Ctrl+Alt+PageDown", origin: "Media", action: "Next track" },
            { keys: "Ctrl+Shift+Del", origin: "Browser", action: "Clear browsing data" },
            { keys: "Alt+Home", origin: "Browser", action: "Home page" },
            { keys: "Alt+End", origin: "f.lux", action: "Toggle (1 hour)" },
            { keys: "Alt+PageUp", origin: "f.lux", action: "Brighten" },
            { keys: "Alt+PageDown", origin: "f.lux", action: "Dim" },
            { keys: "Ctrl+Ins", origin: "Browser", action: "Copy" },
            { keys: "Ctrl+PageDown", origin: "Browser", action: "Next tab" },
            { keys: "Ctrl+PageUp", origin: "Browser", action: "Previous tab" },
            { keys: "Shift+Ins", origin: "Browser", action: "Paste" },
            { keys: "Shift+Del", origin: "Browser", action: "Cut" },
            { keys: "Home", origin: "Browser", action: "Scroll to top" },
            { keys: "End", origin: "Browser", action: "Scroll to bottom" },
            { keys: "PageUp", origin: "Browser", action: "Scroll up a page" },
            { keys: "PageDown", origin: "Browser", action: "Scroll down a page" },
            // Tab
            { keys: "Tab", origin: "Browser", action: "Focus next" },
            { keys: "Shift+Tab", origin: "Browser", action: "Focus previous" },
            { keys: "Ctrl+Tab", origin: "Browser", action: "Next tab" },
            { keys: "Ctrl+Shift+Tab", origin: "Browser", action: "Previous tab" },
            { keys: "Alt+Tab", origin: "System", action: "Next window" },
            { keys: "Alt+Shift+Tab", origin: "System", action: "Previous window" },
            // F-keys row
            { keys: "Shift+Esc", origin: "Browser", action: "Task Manager" },
            { keys: "Ctrl+Esc", origin: "System", action: "Start menu" },
            { keys: "Ctrl+Shift+Esc", origin: "System", action: "Task manager" },
            { keys: "Alt+Esc", origin: "System", action: "Focus next window" },
            { keys: "F1", origin: "Browser", action: "Help" },
            { keys: "F3", origin: "Browser", action: "Find" },
            { keys: "Ctrl+F4", origin: "Browser", action: "Close Tab/Window" },
            { keys: "Alt+F4", origin: "System", action: "Close Window" },
            { keys: "F5", origin: "Browser", action: "Refresh Page" },
            { keys: "F11", origin: "Browser", action: "Full Screen" },
            { keys: "F12", origin: "Browser", action: "Developer Tools" },
            // Top row
            { keys: "Ctrl+1", origin: "Browser", action: "Select tab 1" },
            { keys: "Ctrl+2", origin: "Browser", action: "Select tab 2" },
            { keys: "Ctrl+3", origin: "Browser", action: "Select tab 3" },
            { keys: "Ctrl+4", origin: "Browser", action: "Select tab 4" },
            { keys: "Ctrl+5", origin: "Browser", action: "Select tab 5" },
            { keys: "Ctrl+6", origin: "Browser", action: "Select tab 6" },
            { keys: "Ctrl+7", origin: "Browser", action: "Select tab 7" },
            { keys: "Ctrl+8", origin: "Browser", action: "Select tab 8" },
            { keys: "Ctrl+9", origin: "Browser", action: "Select tab 9" },
            { keys: "Ctrl+0", origin: "Browser", action: "Select last tab" },
            { keys: "Ctrl+-", origin: "Browser", action: "Zoom out" },
            { keys: "Ctrl+=", origin: "Browser", action: "Zoom in" },
            { keys: "Backspace", origin: "Browser", action: "Previous History" },
            // Arrow keys
            { keys: "Ctrl+Alt+Up", origin: "Media", action: "Player volume up" },
            { keys: "Ctrl+Alt+Down", origin: "Media", action: "Player volume down" },
            { keys: "Ctrl+Alt+Left", origin: "Media", action: "Seek backward" },
            { keys: "Ctrl+Alt+Right", origin: "Media", action: "Seek forward" },
            { keys: "Alt+Left", origin: "Browser", action: "Previous History" },
            { keys: "Alt+Right", origin: "Browser", action: "Next History" },
            { keys: "Up", origin: "Browser", action: "Scroll up" },
            { keys: "Down", origin: "Browser", action: "Scroll down" },
            { keys: "Left", origin: "Browser", action: "Scroll left" },
            { keys: "Right", origin: "Browser", action: "Scroll right" },
            // Alpha
            { keys: "Ctrl+Shift+B", origin: "Browser", action: "Toggle bookmarks bar" },
            { keys: "Ctrl+Shift+D", origin: "Browser", action: "Bookmark Open Pages" },
            { keys: "Ctrl+Shift+I", origin: "Browser", action: "Developer Tools" },
            { keys: "Ctrl+Shift+N", origin: "Browser", action: "New Incognito Window" },
            { keys: "Ctrl+Shift+O", origin: "Browser", action: "Bookmarks Manager" },
            { keys: "Ctrl+Shift+Q", origin: "Browser", action: "Quit" },
            { keys: "Ctrl+Shift+R", origin: "Browser", action: "Force Refresh" },
            { keys: "Ctrl+Shift+T", origin: "Browser", action: "Recently Closed" },
            { keys: "Ctrl+Shift+W", origin: "Browser", action: "Close Window" },
            { keys: "Alt+Shift+I", origin: "Browser", action: "Report an Issue" },
            { keys: "Ctrl+A", origin: "Browser", action: "Select All" },
            { keys: "Ctrl+C", origin: "Browser", action: "Copy" },
            { keys: "Ctrl+D", origin: "Browser", action: "Bookmark" },
            { keys: "Ctrl+E", origin: "Browser", action: "Search Engine" },
            { keys: "Ctrl+F", origin: "Browser", action: "Find" },
            { keys: "Ctrl+G", origin: "Browser", action: "Find" },
            { keys: "Ctrl+H", origin: "Browser", action: "History" },
            { keys: "Ctrl+J", origin: "Browser", action: "Downloads" },
            { keys: "Ctrl+K", origin: "Browser", action: "Search Engine" },
            { keys: "Ctrl+N", origin: "Browser", action: "New Window" },
            { keys: "Ctrl+O", origin: "Browser", action: "Open" },
            { keys: "Ctrl+P", origin: "Browser", action: "Print" },
            { keys: "Ctrl+R", origin: "Browser", action: "Refresh" },
            { keys: "Ctrl+S", origin: "Browser", action: "Save Page" },
            { keys: "Ctrl+T", origin: "Browser", action: "New Tab" },
            { keys: "Ctrl+U", origin: "Browser", action: "View Source" },
            { keys: "Ctrl+V", origin: "Browser", action: "Paste" },
            { keys: "Ctrl+W", origin: "Browser", action: "Close Tab" },
            { keys: "Ctrl+X", origin: "Browser", action: "Cut" },
            { keys: "Ctrl+Z", origin: "Browser", action: "Undo" },
            { keys: "Alt+D", origin: "Browser", action: "Select Address Bar" },
            { keys: "Alt+E", origin: "Browser", action: "File Menu" },
            { keys: "Alt+F", origin: "Browser", action: "File Menu" },
        ];
        ReservedCombinations.forEach(function (rc) {
            if (rc.overrideable === undefined) {
                if (rc.origin === "System")
                    rc.overrideable = false;
                else if (rc.origin === "Media")
                    rc.overrideable = false;
                else if (rc.origin === "f.lux")
                    rc.overrideable = false;
                else if (rc.origin === "Browser")
                    rc.overrideable = true;
                else {
                    console.warn("No default overrideable setting for", rc.origin);
                    rc.overrideable = false; // Be pessemistic
                }
            }
        });
        /**
         * Return a list of any browser/system/global keybindings which might conflict with your simple key combination,
         * along with information about the `keys`, `origin`, and `action` that your combo conflicts with.  Some examples:
         *
         * ```js
         * { keys: "Ctrl+Shift+B",      origin: "Browser", action: "Toggle bookmarks bar" }
         * { keys: "F1",                origin: "Browser", action: "Help"                 }
         * { keys: "Ctrl+Shift+Esc",    origin: "System",  action: "Task manager"         }
         * { keys: "Ctrl+Alt+Up",       origin: "Media",   action: "Player volume up"     }
         * { keys: "Alt+PageDown",      origin: "f.lux",   action: "Dim"                  }
         * ```
         *
         * Some bindings will be fine to override (you may not have f.lux installed at all), others can't possibly be
         * overridden at all (`Ctrl+Alt+Del`).
         *
         * @param skc Your simple key combination that might conflict with system keybindings.
         */
        function systemConflictsWithSimpleKeyCombo(skc) {
            return ReservedCombinations.filter(function (re) {
                var reSkc = keyboard.parseSimpleKeyCombo(re.keys);
                var reKeyOrCode = reSkc.mmkKey || reSkc.mmkCode;
                if (!reKeyOrCode) {
                    console.warn("Cannot detect conflicts with", re.keys, "yet");
                    return false;
                }
                if (skc.ctrl !== undefined && reSkc.ctrl !== undefined && skc.ctrl !== reSkc.ctrl)
                    return false;
                if (skc.alt !== undefined && reSkc.alt !== undefined && skc.alt !== reSkc.alt)
                    return false;
                if (skc.shift !== undefined && reSkc.shift !== undefined && skc.shift !== reSkc.shift)
                    return false;
                if (skc.meta !== undefined && reSkc.meta !== undefined && skc.meta !== reSkc.meta)
                    return false;
                if (skc.mmkKey === reKeyOrCode)
                    return true;
                if (skc.mmkCode === reKeyOrCode)
                    return true;
                return false;
            });
        }
        keyboard.systemConflictsWithSimpleKeyCombo = systemConflictsWithSimpleKeyCombo;
        addEventListener("load", function () {
            console.assert(systemConflictsWithSimpleKeyCombo(keyboard.parseSimpleKeyCombo("Left")).filter(function (r) { return !r.overrideable || r.action.indexOf("Scroll") === -1; }).length == 0);
            console.assert(systemConflictsWithSimpleKeyCombo(keyboard.parseSimpleKeyCombo("!Alt+Left")).filter(function (r) { return !r.overrideable || r.action.indexOf("Scroll") === -1; }).length == 0);
            console.assert(systemConflictsWithSimpleKeyCombo(keyboard.parseSimpleKeyCombo("?Alt+Left")).filter(function (r) { return !r.overrideable || r.action.indexOf("Scroll") === -1; }).length > 0);
            console.assert(systemConflictsWithSimpleKeyCombo(keyboard.parseSimpleKeyCombo("Alt+Left")).filter(function (r) { return !r.overrideable || r.action.indexOf("Scroll") === -1; }).length > 0);
        });
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        function padR(v, pad) { v = v !== undefined ? v : ""; return v + pad.substr(Math.min(v.length, pad.length)); }
        function padL(v, pad) { v = v !== undefined ? v : ""; return pad.substr(Math.min(v.length, pad.length)) + v; }
        function debugDumpKeyboardEvent(ev) {
            if (!keyboard.config.debugEvents)
                return;
            if (keyboard.config.debugLog && (!keyboard.config.debugLogOnlyDown || ev.type === "keydown") && (!keyboard.config.debugIgnoreRepeat || !ev.mmkRepeat)) {
                var log = [];
                log.push("semi-raw " + padR(ev.type + ":", "         "));
                if (keyboard.config.debugLogBaked)
                    log.push("| mmk", ev.mmkRepeat ? "\u21BB" : " ", "code", padR(ev.mmkCode || "", "            "), "key", padR(ev.mmkKey || "", "            "));
                if (keyboard.config.debugLogRaw)
                    log.push("| raw", ev.repeat ? "\u21BB" : " ", "code", padR(ev.code, "            "), "key", padR(ev.key, "            "), "keyCode", padL(ev.keyCode.toString(), "   "), "(0x" + padL(ev.keyCode.toString(16), "00") + ")", "which", padL(ev.which.toString(), "   "), "(0x" + padL(ev.which.toString(16), "00") + ")", "timestamp", Date.now());
                if (keyboard.config.debugLogMods)
                    log.push("| mod", ev.ctrlKey ? "ctrl" : "    ", ev.altKey ? "alt" : "   ", ev.shiftKey ? "shift" : "     ", ev.metaKey ? "meta" : "    ");
                if (keyboard.config.debugLogOriginalEvent)
                    log.push("| ev", ev);
                log.push("|");
                console.log.apply(console, __spread(log));
            }
            if (keyboard.config.debugAssertKeyDefined) {
                var KeyValues = Object.keys(keyboard.Key);
                if (ev.mmkCode !== undefined && !/0x/.test(ev.mmkCode)) {
                    var index = KeyValues.indexOf(ev.mmkCode);
                    console.assert(index !== -1, "mmkCode: Key." + ev.mmkCode + " === undefined");
                    console.assert(KeyValues[index] === ev.mmkCode, "mmkCode: Key." + ev.mmkCode + " === \"" + KeyValues[index] + "\" !== \"" + ev.mmkCode + "\"");
                }
                if (ev.type !== "keypress" || ev.mmkKey !== undefined) {
                    var index = KeyValues.indexOf(ev.mmkCode || "");
                    console.assert(index !== -1, "mmkKey: Key." + ev.mmkKey + " === undefined");
                    console.assert(KeyValues[index] === ev.mmkKey, "mmkKey: Key." + ev.mmkKey + " === \"" + KeyValues[index] + "\" !== \"" + ev.mmkKey + "\"");
                }
            }
        }
        keyboard.debugDumpKeyboardEvent = debugDumpKeyboardEvent;
        function debugDumpFocusEvent(ev) {
            console.log("semi-raw " + ev.type);
        }
        keyboard.debugDumpFocusEvent = debugDumpFocusEvent;
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        var config;
        (function (config) {
            // IE11 reports keyboardEvent.repeat === false, even on repeat events.
            // This workaround detects duplicate keydown events to determine if the key is really down or not instead.
            // There is the possibility of a single unfixable false negative if the window was not focused when the key started repeating.
            config.fixRepeat = true;
            // Chrome will also report keyboardEvent.repeat === true, for e.g. the second event of LeftControl + RightControl.
            // TODO:  Fix that system false positive?  Alternatively, add the 'false' positive bellow by ignoring .location ?
        })(config = keyboard.config || (keyboard.config = {})); // namespace config
        var lastEvents = {
            // NOTE WELL: fixEventRepeat cares about the difference between null / undefined!  I'm sorry.
            "keydown": null,
            "keypress": null
            // keyup ignored
        };
        function fixEventMmkRepeat(event) {
            event.mmkRepeat = event.repeat || false;
            if (!config.fixRepeat)
                return;
            if (event.repeat)
                config.fixRepeat = false; // Oh, the system already takes care of it.  Neat!
            // Track previous event
            if (event.type == "keyup") {
                Object.keys(lastEvents).forEach(function (key) { return lastEvents[key] = null; });
            }
            var prevEvent = lastEvents[event.type];
            if (prevEvent === undefined)
                return; // not an event type we need to fix up
            if (prevEvent === null) {
                lastEvents[event.type] = event;
                return;
            } // no previous event, no need to fix up
            console.assert(prevEvent.type == event.type);
            lastEvents[event.type] = event;
            // Okay, is this a duplicate event?
            if (prevEvent.keyCode !== event.keyCode)
                return;
            if (prevEvent.charCode !== event.charCode)
                return;
            if (prevEvent.code !== event.code)
                return;
            if (prevEvent.which !== event.which)
                return;
            if (prevEvent.altKey !== event.altKey)
                return;
            if (prevEvent.ctrlKey !== event.ctrlKey)
                return;
            if (prevEvent.shiftKey !== event.shiftKey)
                return;
            if (prevEvent.metaKey !== event.metaKey)
                return;
            if (prevEvent.location !== event.location)
                return;
            // Identical-enough events for me.
            event.mmkRepeat = true;
        }
        keyboard.fixEventMmkRepeat = fixEventMmkRepeat;
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        // The numpad is particularly finicky
        var code_key_to_mmkCode = {
            "Numpad1 End": "NumpadEnd",
            "Numpad2 ArrowDown": "NumpadDown",
            "Numpad3 PageDown": "NumpadPageDown",
            "Numpad4 ArrowLeft": "NumpadLeft",
            "Numpad5 Clear": "NumpadClear",
            "Numpad6 ArrowRight": "NumpadRight",
            "Numpad7 Home": "NumpadHome",
            "Numpad8 ArrowUp": "NumpadUp",
            "Numpad9 PageUp": "NumpadPageUp",
            "Numpad0 Insert": "NumpadInsert",
            "NumpadDecimal Delete": "NumpadDelete"
        };
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
        var code_to_mmkCode = {
            "Left": "ArrowLeft",
            "Right": "ArrowRight",
            "Up": "ArrowUp",
            "Down": "ArrowDown",
            // Pure paranoia
            "0": "Digit0",
            "1": "Digit1",
            "2": "Digit2",
            "3": "Digit3",
            "4": "Digit4",
            "5": "Digit5",
            "6": "Digit6",
            "7": "Digit7",
            "8": "Digit8",
            "9": "Digit9",
            // < FF 49, < Chrome 50
            "VolumeMute": "AudioVolumeMute",
            "VolumeDown": "AudioVolumeDown",
            "VolumeUp": "AudioVolumeUp",
            // < FF 48, Current Chrome?
            "OSLeft": "MetaLeft",
            "OSRight": "MetaRight"
        };
        function fixEventMmkCode_FromCode(event) {
            if (event.code === undefined)
                return;
            var tmpMmkCode;
            var m;
            if ((event.code === "") || (event.code === "Unidentified"))
                event.mmkCode = "0x" + event.keyCode.toString(16).toUpperCase(); // TODO: Add hex value?
            else if ((tmpMmkCode = code_key_to_mmkCode[event.code + " " + event.key]))
                event.mmkCode = tmpMmkCode;
            else if ((tmpMmkCode = code_to_mmkCode[event.code]))
                event.mmkCode = tmpMmkCode;
            else
                event.mmkCode = event.code; // Assume the original code was OK.  Sketchy - run with config.debugAssertKeyDefined during development to detect problems.
        }
        keyboard.fixEventMmkCode_FromCode = fixEventMmkCode_FromCode;
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        var keyCode_key_to_mmkCode = {
        //"40 Down":  "NumpadDown",
        //"37 Left":  "NumpadLeft",
        //"12 Clear": "NumpadClear",
        //"39 Right": "NumpadRight",
        };
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        var keyupdown_keyCode_to_mmkKey = {
            0x03: "Cancel",
            0x06: "Help",
            0x08: "Backspace",
            0x09: "Tab",
            // 0x0C: // NumpadEqual (Win) or Numlock (Mac) or NumpadClear (Numpad5 without numlock)
            0x0D: "Enter",
            // 0x0E: "Enter", // Weird reserved but unused gecko constant?
            // XXX: We can't differentiate between Left/Right with only keyCode
            0x10: "Shift",
            0x11: "Control",
            0x12: "Alt",
            0x13: "Pause",
            0x14: "CapsLock",
            0x1B: "Escape",
            0x20: "Space",
            0x21: "PageUp",
            0x22: "PageDown",
            0x23: "End",
            0x24: "Home",
            0x25: "ArrowLeft",
            0x26: "ArrowUp",
            0x27: "ArrowRight",
            0x28: "ArrowDown",
            0x2a: "PrintScreen",
            0x2c: "PrintScreen",
            0x2d: "Insert",
            0x2e: "Delete",
            0x2f: "Help",
            0x30: "Digit0",
            0x31: "Digit1",
            0x32: "Digit2",
            0x33: "Digit3",
            0x34: "Digit4",
            0x35: "Digit5",
            0x36: "Digit6",
            0x37: "Digit7",
            0x38: "Digit8",
            0x39: "Digit9",
            // 0x3A: Colon or Comma, rare?
            0x3b: "Semicolon",
            0x3c: "LessThan",
            0x3d: "NumpadEqual",
            0x3e: "GreaterThan",
            0x3f: "QuestionMark",
            // 0x40: "At", // @ or LeftBracket, depending (tm)?
            0x41: "KeyA",
            0x42: "KeyB",
            0x43: "KeyC",
            0x44: "KeyD",
            0x45: "KeyE",
            0x46: "KeyF",
            0x47: "KeyG",
            0x48: "KeyH",
            0x49: "KeyI",
            0x4a: "KeyJ",
            0x4b: "KeyK",
            0x4c: "KeyL",
            0x4d: "KeyM",
            0x4e: "KeyN",
            0x4f: "KeyO",
            0x50: "KeyP",
            0x51: "KeyQ",
            // 0xBA: "KeyQ", // Greek on Mac/Linux?  Al
            0x52: "KeyR",
            0x53: "KeyS",
            0x54: "KeyT",
            0x55: "KeyU",
            0x56: "KeyV",
            0x57: "KeyW",
            0x58: "KeyX",
            0x59: "KeyY",
            0x5a: "KeyZ",
            0x5b: "MetaLeft",
            0x5c: "MetaRight",
            0x5d: "ContextMenu",
            0x60: "Numpad0",
            0x61: "Numpad1",
            0x62: "Numpad2",
            0x63: "Numpad3",
            0x64: "Numpad4",
            0x65: "Numpad5",
            0x66: "Numpad6",
            0x67: "Numpad7",
            0x68: "Numpad8",
            0x69: "Numpad9",
            0x6a: "NumpadMultiply",
            0x6b: "NumpadAdd",
            0x6c: "NumpadSeperator",
            0x6d: "NumpadSubtract",
            0x6e: "NumpadDecimal",
            0x6f: "NumpadDivide",
            0x70: "F1",
            0x71: "F2",
            0x72: "F3",
            0x73: "F4",
            0x74: "F5",
            0x75: "F6",
            0x76: "F7",
            0x77: "F8",
            0x78: "F9",
            0x79: "F10",
            0x7a: "F11",
            0x7b: "F12",
            // Very platform specific
            // 0x7c: "F13",
            // 0x7d: "F14",
            // 0x7e: "F15",
            // 0x7f: "F16",
            // 0x80: "F17",
            // 0x81: "F18",
            // 0x82: "F19",
            // 0x83: "F20",
            // 0x84: "F21",
            // 0x85: "F22",
            // 0x86: "F23",
            // 0x87: "F24",
            0x90: "NumLock",
            0x91: "ScrollLock",
            0xba: "Semicolon",
            0xbb: "Equal",
            0xbc: "Comma",
            0xbd: "Minus",
            0xbe: "Period",
            0xbf: "Slash",
            0xc0: "Backquote",
            0xc1: "IntlRo",
            0xc2: "NumpadComma",
            0xdb: "BracketLeft",
            0xdc: "Backslash",
            0xdd: "BracketRight",
            0xde: "Quote"
        };
        var mac_keyCode_to_mmkKey = {
            0x0C: "NumLock", 0xBB: "NumpadEqual",
            0x2C: "F13", 0x7C: "PrintScreen",
            0x91: "F14", 0x7D: "ScrollLock",
            0x13: "F15", 0x7E: "Pause"
        };
        // This is just easier to fix up after the fact
        var mmkKey_to_mmkKey = {
            "NumpadNumlock": "Numlock",
            "NumpadDel": "NumpadDelete"
        };
        function startsWith(v, prefix) {
            if (v.length < prefix.length)
                return false;
            for (var i = 0; i < prefix.length; ++i)
                if (v[i] !== prefix[i])
                    return false;
            return true;
        }
        function endsWith(v, postfix) {
            if (v.length < postfix.length)
                return false;
            var diff = v.length - postfix.length;
            for (var i = 0; i < postfix.length; ++i)
                if (v[i + diff] !== postfix[i])
                    return false;
            return true;
        }
        function ensurePostfix(v, postfix) { return endsWith(v, postfix) ? v : (v + postfix); }
        function ensurePrefix(v, prefix) { return startsWith(v, prefix) ? v : (prefix + v); }
        function fixEventMmkKey_FromUpDownKeyCode(event) {
            if (event.type === "keypress")
                return; // Above tables etc. are calibrated against keydown/up keycodes - yess, keypress keycodes are different!
            var s;
            var m;
            // TODO: Consult keyboard layout mapping table
            if ((s = keyupdown_keyCode_to_mmkKey[event.keyCode]))
                event.mmkKey = s;
            else
                event.mmkKey = "0x" + event.keyCode.toString(16).toUpperCase();
            if (event.location !== undefined) {
                switch (event.location) {
                    case KeyboardEvent.DOM_KEY_LOCATION_LEFT:
                        event.mmkKey = ensurePostfix(event.mmkKey, "Left");
                        break;
                    case KeyboardEvent.DOM_KEY_LOCATION_RIGHT:
                        event.mmkKey = ensurePostfix(event.mmkKey, "Right");
                        break;
                    case KeyboardEvent.DOM_KEY_LOCATION_NUMPAD:
                        event.mmkKey = ensurePrefix(event.key, "Numpad");
                        break;
                }
            }
            if ((s = mmkKey_to_mmkKey[event.mmkKey]))
                event.mmkKey = s;
        }
        keyboard.fixEventMmkKey_FromUpDownKeyCode = fixEventMmkKey_FromUpDownKeyCode;
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
/* Copyright 2017 MaulingMonkey

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
// We need some event handlers immediately - waiting for "load" will cause our
// fixup event handlers to execute too late (after any immediately registered
// user defined event handlers!).  To ensure the final .js outputs things in a
// sane order, we'll explicitly reference our *.ts dependencies for once.
/// <reference path="../rawEventListeners/debugDumpEvent.ts" />
/// <reference path="../rawEventListeners/fixEventMmkRepeat.ts" />
/// <reference path="../rawEventListeners/fixEventMmkCode_FromCode.ts" />
/// <reference path="../rawEventListeners/fixEventMmkKey_FromUpDownKeyCode.ts" />
var mmk;
(function (mmk) {
    var keyboard;
    (function (keyboard) {
        /** @hidden */
        var hasEventListener = "addEventListener" in window;
        /** @hidden */
        function addRawEventListener(target, type, listener) {
            if (hasEventListener) {
                var t = target;
                t.addEventListener(type, listener, true);
            }
            else {
                var ontype = "on" + type;
                var t = target;
                var oldCallback_1 = t[ontype];
                // Don't add duplicate event listeners, or event listener objects.
                var dedupeListId = "__" + ontype + "_dedupe";
                var dedupeList = (t[dedupeListId] = t[dedupeListId] || []);
                if (dedupeList.indexOf(listener) !== -1)
                    return; // Duplicate
                dedupeList.push(listener); // New/unique
                if ("handleEvent" in listener) {
                    if (oldCallback_1)
                        t[ontype] = function (e) { oldCallback_1.call(this, e); listener.handleEvent(e); };
                    else
                        t[ontype] = function (e) { listener.handleEvent(e); };
                }
                else {
                    if (oldCallback_1)
                        t[ontype] = function (e) { oldCallback_1.call(this, e); listener.call(this, e); };
                    else
                        t[ontype] = function (e) { listener.call(this, e); };
                }
            }
        }
        // Primary event order - this is what requires those reference tags earlier.
        // add mmkRepeat field
        addRawEventListener(window, "keyup", keyboard.fixEventMmkRepeat);
        addRawEventListener(window, "keydown", keyboard.fixEventMmkRepeat);
        addRawEventListener(window, "keypress", keyboard.fixEventMmkRepeat);
        // add mmkCode field
        addRawEventListener(window, "keyup", keyboard.fixEventMmkCode_FromCode);
        addRawEventListener(window, "keydown", keyboard.fixEventMmkCode_FromCode);
        addRawEventListener(window, "keypress", keyboard.fixEventMmkCode_FromCode);
        // add mmkKey field
        addRawEventListener(window, "keyup", keyboard.fixEventMmkKey_FromUpDownKeyCode);
        addRawEventListener(window, "keydown", keyboard.fixEventMmkKey_FromUpDownKeyCode);
        addRawEventListener(window, "keypress", keyboard.fixEventMmkKey_FromUpDownKeyCode);
        // log to console based on mmk.keyboard.config settings
        addRawEventListener(window, "keyup", keyboard.debugDumpKeyboardEvent);
        addRawEventListener(window, "keydown", keyboard.debugDumpKeyboardEvent);
        addRawEventListener(window, "keypress", keyboard.debugDumpKeyboardEvent);
        addRawEventListener(window, "blur", keyboard.debugDumpFocusEvent);
    })(keyboard = mmk.keyboard || (mmk.keyboard = {}));
})(mmk || (mmk = {})); // namespace mmk.keyboard
//# sourceMappingURL=global.js.map
//# sourceMappingURL=demo.js.map