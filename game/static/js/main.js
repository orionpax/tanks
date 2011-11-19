// TODO: replace following with window.addEventListener('load', eventWindowLoaded, false);

window.addEventListener('DOMContentLoaded', function() {
    vLog.log('Hello');
}, false);

window.onload = function() {
    // initCanvas('canvasOne');
    CanvasBlackjack.init();
/*    CanvasBlackjack.renderField(); */
    window.onresize = CanvasBlackjack.center;
    CanvasBlackjack.center();

    var tank = new Tank(CanvasBlackjack.context(), function() {
        tank.place(70, 70);
        MainLoop.start();
    });
}

