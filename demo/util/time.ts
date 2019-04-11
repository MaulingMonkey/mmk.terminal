function time (label: string, action: ()=>void) {
    let start = Date.now();
    action();
    let stop = Date.now();
    console.log(label + ": " + (stop-start).toString() + "ms");
}
