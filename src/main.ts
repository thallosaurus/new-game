import { createShader, createProgram, loadTexture } from "./render/utils";
import { init } from "./render/webgl";
import { TiledJsonMap } from "./types/TiledJsonMap";

window.addEventListener("load", (ev) => {
    //sayHello("Hello World");

        /*let gl = init();


        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // Clear the color buffer with specified clear color
        gl.clear(gl.COLOR_BUFFER_BIT);

        var positionBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        // three 2d points
        var positions = [
            0, 0,
            0, 0.5,
            0.7, 0,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);*/


        let map = TiledJsonMap.load("TestMap1");

        const canvas = document.getElementById("maincanvas") as HTMLCanvasElement;
        let ctx = canvas.getContext("2d")!;

        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;

        window.addEventListener("resize", (ev) => {
            console.log(ev);
            canvas.height = (ev.target as Window).innerHeight;
            canvas.width = (ev.target as Window).innerWidth;
        });

        map.then(m => {
            let last_tick = 0;
            const drawLoop = (ts: number) => {

                let sixtyFps = 1000/60;

                if (last_tick < ts - sixtyFps) {
                    last_tick = ts;

                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                    m.draw(ctx);
                }

                requestAnimationFrame(drawLoop);
            }
            requestAnimationFrame(drawLoop);
        });
});