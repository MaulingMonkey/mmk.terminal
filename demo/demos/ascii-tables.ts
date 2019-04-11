namespace demos.ascii_tables {
    interface Table {
        top:    number;
        left:   number;
        fg:     string;
        bg:     string;
    }

    const tables : Table[] = [
        { left:  0, top:  0, fg: '#000', bg: '#FFF' },
        { left: 19, top:  0, fg: '#FFF', bg: '#000' },

        { left:  0, top: 19, fg: '#020', bg: '#6F6' },
        { left: 19, top: 19, fg: '#6F6', bg: '#020' },

        { left:  0, top: 38, fg: '#210', bg: '#FD6' },
        { left: 19, top: 38, fg: '#FD6', bg: '#210' },
    ];

    function initAsciiTable (asciiTables: mmk.terminal.WebGLTerminalCanvas) {
        //const bar = '|', dash = '-', cross = '+';
        //const bar = '\xB3', dash = '\xC4', cross = '\xC5';
        const bar = '\xBA', dash = '\xCD', cross = '\xCE';

        for (const table of tables) {
            const {fg,bg} = table;
            asciiTables.set(table.left + 0, table.top + 0, ' ',   fg, bg);
            asciiTables.set(table.left + 1, table.top + 0, bar,   fg, bg);
            asciiTables.set(table.left + 1, table.top + 1, cross, fg, bg);
            asciiTables.set(table.left + 0, table.top + 1, dash,  fg, bg);
            for (let i=0; i<16; ++i) {
                let hex = '0123456789ABCDEF'[i];
                asciiTables.set(table.left + 2 + i, table.top + 0, hex,  fg, bg);
                asciiTables.set(table.left + 2 + i, table.top + 1, dash, fg, bg);
                asciiTables.set(table.left + 0, table.top + 2 + i, hex,  fg, bg);
                asciiTables.set(table.left + 1, table.top + 2 + i, bar,  fg, bg);
            }
            for (let y=0; y<16; ++y) {
                for (let x=0; x<16; ++x) {
                    const code = y * 16 + x;
                    asciiTables.set(table.left + 2 + x, table.top + 2 + y, String.fromCharCode(code), fg, bg);
                }
            }
        }
    }

    addEventListener("load", function() {
        time("ascii-tables-webgl", ()=>{
            const canvas = new mmk.terminal.WebGLTerminalCanvas({
                canvas: "ascii-tables",
                bufferSize: [2*19+1, 3*19+1],
                background: '#FFF',
                zoom: 2,
            });
            initAsciiTable(canvas);
            eachFrame(() => canvas.tryRender());
        });
    });
}
