namespace mmk.terminal {
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
    export class Texture {
        private texture: WebGLTexture | null = null;
        public isReady (): boolean { return this.texture !== null; }

        public constructor (webgl: WebGLRenderingContext, src: string | HTMLImageElement) {
            let image : HTMLImageElement;
            if (typeof src === 'string') {
                image = document.createElement("img");
                image.src = src;
            }
            else {
                image = src;
            }

            const self = this;
            function resolve () {
                console.assert(image.complete);
                const texture = self.texture = webgl.createTexture();
                webgl.bindTexture(webgl.TEXTURE_2D, texture);
                webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, webgl.RGBA, webgl.UNSIGNED_BYTE, image);
                webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
                webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
                webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
                webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);
            };

            if (image.complete) resolve();
            else                image.addEventListener("load", resolve);
        }

        /** May fail if the texture hasn't loaded yet, or errored out, or ... */
        public tryBindTo (webgl: WebGLRenderingContext, index: number): boolean {
            if (this.texture === null) return false;
            webgl.activeTexture(webgl.TEXTURE0 + index);
            webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
            return true;
        }
    }
}
