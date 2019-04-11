const ref = `




#057                  #_   _#  _'_  #   # #     ''#'' #_  # _'''_
#0AC                  # '_' # #___# #   # #       #   # '_# #    
#4DF                  #     # #   # #   # #       #   #   # # ''#
#FFF                  #     # #   # '___' #____ __#__ #   # '___'


#402                      #_ _# _'''_ #_  # #  _' #'''' '_ _'      
#814                      # ' # #   # # '_# #_'   #___    #        
#F0A                      #   # #   # #   # # '_  #       #        
#F9C                      #   # '___' #   # #   # #____   #        


#FFF                  NPM  -+-  @maulingmonkey/terminal
#DDD                  GIT  -+-  github.com/MaulingMonkey/mmk.terminal
#999                 DEMO  -+-  maulingmonkey.com/mmk.terminal/demo/
#666              LICENSE  -+-  Apache 2.0



#BB0                                                                          \xEA         Yellow omegas are ZZT monkeys, right?
`;

interface Line {
    text:       string;
    foreground: string;
    background: string;
}

const lines : Line[] = [];

for (const line of ref.split('\n')) {
    const m = /^(#[0-9a-f]+)(.*)$/i.exec(line);
    lines.push({
        text:       m ? m[2] : line,
        foreground: m ? m[1] : '#FFF',
        background: '#000',
    });
}

interface Remap {
    text:           string;
    foreground?:    string;
    background?:    string;
}

const remap : {[ch: string]: Remap} = {
    '#':  { text: '\xDB' },
    '\'': { text: '\xDF' },
    '_':  { text: '\xDC' },
    '-':  { text: '\xC4' },
    '+':  { text: '\xD7' },
};

addEventListener("load", function() {
    const c = new mmk.terminal.WebGLTerminalCanvas({ canvas: "block-art", background: '#000' });

    function render () {
        requestAnimationFrame(render);

        for (let y=0; y<lines.length; ++y) {
            const line = lines[y];
            for (let x=0; x<line.text.length; ++x) {
                let text = line.text[x];
                const r = remap[text] || {};
                c.set(x, y, r.text || text, r.foreground || line.foreground, r.background || line.background);
            }
        }

        c.tryRender();
    }

    time("First render", render);
});
