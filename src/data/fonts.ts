/** @hidden */
namespace mmk.terminal.fonts {
    export interface BitmapFont {
        image:      string | HTMLImageElement;
        charSize:   [number, number];
        gridSize:   [number, number];
    }

    export const pc_bios_8x8 : BitmapFont = {
        image:      'data:image/png;base64,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',
        charSize:   [ 8, 8],
        gridSize:   [32, 8],
    };
}