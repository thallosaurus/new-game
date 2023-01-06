import { createShader, createProgram } from "./utils";

export function init(): WebGLRenderingContext {
    let canvas = document.getElementById("maincanvas")! as HTMLCanvasElement;
    var gl = canvas.getContext("webgl")!;
    if (!gl) {
        // no webgl for you!
        alert("No WebGL Support");
    }
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    window.addEventListener("resize", (ev) => {
        canvas.height = (ev.target as Window).innerHeight;
        canvas.width = (ev.target as Window).innerWidth;
    });

    console.log("Web GL Support!");

    //setup shaders
    var vertexShaderSource = document.querySelector("#vertex-shader-2d")!.textContent;
    var fragmentShaderSource = document.querySelector("#fragment-shader-2d")!.textContent;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource!);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource!);

    //console.log(vertexShader);
    //console.log(fragmentShader);

    var program = createProgram(gl, vertexShader!, fragmentShader!)!;
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

    return gl!
}