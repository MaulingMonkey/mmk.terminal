namespace demos.rl_maze {

    const mazeArt = `
        ########################################
        #          #B           #              #
        # ### ################# ############## #
        #   # # # # #         # #            # #
        # # # # # # # ### ### # # ####### ## # #
        # # # # #   # #     # # # #     #  # # #
        ### # # # # # ####### # # ##### # ## # #
        #   # #   # # #     # # #       # #  # #
        # ######### # ##### # # ####### # #### #
        # #                 #         # #      #
        # # ########################### ########
        # # # #        #                       #
        # # # # ######## ##################### #
        # # # # #        #                   # #
        # # # # # ######## ################# # #
        # # # #   #        #        #        # #
        # # # ### # ###### ######## # ######## #
        # # #   # #   # #  #      # #          #
        #   ### # # # # # ### ### # # ######## #
        # # #   # # # # #   # # # # #    # #   #
        ### # # # # ### # ### # # # # ## # # ###
        # #   # # #     #       # # # #    # # #
        # # ##### ##### ########### # ###### # #
        #         #                 #@#        #
        ########################################
    `.trim().split('\n').map(l => l.trim());

    interface Cell { text: string; fg: string; bg: string; passable: boolean; }
    type XY = [number, number];
    let playerPos : XY = [1,1];
    let maze : Cell[][] = [];
    const mazeWidth  = Math.max(...mazeArt.map(l => l.length));
    const mazeHeight = mazeArt.length;
    let canvas : mmk.terminal.WebGLTerminalCanvas | undefined;

    //console.assert(mazeWidth === 80);
    console.assert(mazeHeight === 25);

    const mazeArtRemap : {[ch: string]: Cell | ((xy: XY) => Cell) | undefined} = {
        "#": { text: "\xDB", fg: '#888', bg: '#222', passable: false, },
        //"#": { text: "\xB2", fg: '#AAA', bg: '#666', passable: false, },
        " ": { text: "\xF9", fg: '#444', bg: '#222', passable: true, },
        "B": { text: "\xF5", fg: '#FF0', bg: '#222', passable: true, },
        "@": (xy) => {
            playerPos = xy;
            return { text: "\xFE", fg: '#444', bg: '#222', passable: true };
        },
    };

    for (let y=0; y<mazeArt.length; ++y) {
        const line = mazeArt[y];

        let mazeCells : Cell[] = [];
        for (let x=0; x<line.length; ++x) {
            const ch = line[x];
            const remapped = mazeArtRemap[ch];
            if (!remapped) {
                mazeCells.push({ text: ch, fg: '#000', bg: '#F0F', passable: true });
            }
            else if (typeof remapped === 'function') {
                mazeCells.push(remapped([x,y]));
            }
            else { // `Cell`
                mazeCells.push(remapped);
            }
        }
        maze.push(mazeCells);
    }

    function cellAt (pos: XY): Cell | undefined {
        const [x,y] = pos;
        if (x < 0 || y < 0) return undefined;
        if (y >= maze.length || x >= maze[y].length) return undefined;
        return maze[y][x];
    }

    function refreshCell (pos: XY) {
        if (!canvas) return;
        const [cx,cy] = pos;
        const [px,py] = playerPos;
        const cell = cellAt(pos);
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
    
    function tryMovePlayer (ev: KeyboardEvent, dx: number, dy: number) {
        if (ev.type === "keydown") {
            if (ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey) return;
            const [x,y] = playerPos;
            const targetPos : XY = [x+dx, y+dy];
            const targetCell = cellAt(targetPos);
            if (targetCell && targetCell.passable) {
                const originalPos = playerPos;
                playerPos = targetPos;
                refreshCell(originalPos);
                refreshCell(targetPos);
            }
            ev.preventDefault();
        }
    }

    addEventListener("keydown", function(ev) {
        console.log(ev);
        const Key = mmk.keyboard.Key;
        switch (ev.mmkCode || ev.mmkKey) {
            case Key.ArrowLeft:                             tryMovePlayer(ev, -1,  0); break;
            case Key.ArrowRight:                            tryMovePlayer(ev, +1,  0); break;
            case Key.ArrowUp:                               tryMovePlayer(ev,  0, -1); break;
            case Key.ArrowDown:                             tryMovePlayer(ev,  0, +1); break;

            case Key.NumpadEnd:         case Key.Numpad1:   tryMovePlayer(ev, -1, +1); break;
            case Key.NumpadDown:        case Key.Numpad2:   tryMovePlayer(ev,  0, +1); break;
            case Key.NumpadPageDown:    case Key.Numpad3:   tryMovePlayer(ev, +1, +1); break;
            case Key.NumpadLeft:        case Key.Numpad4:   tryMovePlayer(ev, -1,  0); break;
            case Key.NumpadClear:       case Key.Numpad5:   tryMovePlayer(ev,  0,  0); break;
            case Key.NumpadRight:       case Key.Numpad6:   tryMovePlayer(ev, +1,  0); break;
            case Key.NumpadHome:        case Key.Numpad7:   tryMovePlayer(ev, -1, -1); break;
            case Key.NumpadUp:          case Key.Numpad8:   tryMovePlayer(ev,  0, -1); break;
            case Key.NumpadPageUp:      case Key.Numpad9:   tryMovePlayer(ev, +1, -1); break;
        }
    });

    addEventListener("load", function(){
        canvas = new mmk.terminal.WebGLTerminalCanvas({
            canvas: "rl-maze",
            bufferSize: [mazeWidth, mazeHeight],
            background: '#000',
            zoom: 2,
        });
        for (let y=0; y<mazeHeight; ++y) for (let x=0; x<mazeWidth; ++x) refreshCell([x,y]);
        eachFrame(function(){
            canvas!.tryRender();
        });
    });
}
