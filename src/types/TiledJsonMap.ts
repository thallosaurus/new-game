import xmlToJSON from "xmltojson";
import { initTextureBuffer, loadTexture } from "../render/utils";

interface TiledLayer {
    data: Uint32Array,
    height: number,
    id: number,
    name: String,
    opacity: number,
    type: "tilelayer" | "none",
    visible: boolean,
    width: number,
    x: number,
    y: number
}

interface TiledTileset {
    firstgid: number,
    source: string
}

class TiledTileset implements TiledTileset {
    _tilesetData!: TiledTilesetData
}

interface TiledTilesetData {
    version: string,
    tiledversion: string,
    name: string,
    tilewidth: number,
    tileheight: number,
    tilecount: number,
    columns: number,
    image: {
        source: string,
        width: number,
        height: number
    }
    tile: [id: TileProperties]
}

class TiledTilesetData implements TiledTilesetData {
    _rawImageData: HTMLImageElement | null = null;

    async load() {
        fetch("../assets/sprites/" + this.image.source)
            .then(resp => {
                return resp.blob();
            })
            .then(blob => {
                let url = URL.createObjectURL(blob);
                let image = new Image();
                image.src = url;
                this._rawImageData = image;
            });
    }
    getTile(tileId: number): ImageBitmap {
        let offscreenCanvas = new OffscreenCanvas(this.tilewidth, this.tileheight);
        let offCtx = offscreenCanvas.getContext("2d")! as OffscreenCanvasRenderingContext2D;
        if (this._rawImageData) {
            //console.log(xy);
            let xy = getXY(tileId, this.columns, this.tilecount / this.columns);
            offCtx.drawImage(this._rawImageData, xy.x * this.tilewidth, xy.y * this.tileheight, this.tilewidth, this.tileheight, 0, 0, this.tilewidth, this.tileheight);
            
            //let x = this.columns % tileId;
            //let y = Math.floor(this.columns / tileId);
            //console.log(x);
        } else {
        offCtx.fillStyle = "red";
        //console.log(xy);
            offCtx.fillRect(0, 0, offCtx.canvas.width, offCtx.canvas.height);
            
            offCtx.fillStyle = "black";
            offCtx.font = "8px Arial";
            offCtx.fillText(String(tileId), 8, 8);
        }
        //offCtx.commit();

        let bitmap = offscreenCanvas.transferToImageBitmap();
        //console.log(bitmap);

        return bitmap;
    }
}

interface TileProperties {
    name: string,
    type: "bool" | "string",
    value: any
}

export interface TiledJsonMap {
    compressionLevel: number,
    infinite: boolean,
    layers: TiledLayer[],
    nextlayerid: number,
    nextobjectid: number,
    orientation: "orthogonal" | "isometric",
    renderorder: "right-down",
    tiledversion: string,
    tileheight: number,
    tilesets: TiledTileset[],
    tilewidth: number,
    type: "map",
    version: string,
    width: number
}

export class TiledJsonMap implements TiledJsonMap {

    static async load(mapName: string): Promise<TiledJsonMap> {

        return fetch("../assets/maps/" + mapName + ".json")
            .then(response => {
                return response.json()
            })
            .then(json => {
                let map = new TiledJsonMap();
                Object.assign(map, json);
                return map;
            })
            .then(async m => {
                let mmap = m.tilesets.map(ts => {
                    return fetch("../assets/tilesets/" + basename(ts.source));
                });


                //console.log(allMaps);
                let allMaps = await Promise.all(mmap);

                let upd = m.tilesets.map((tileset, index) => {
                    let datats = new TiledTileset();
                    Object.assign(datats, tileset);

                    //assign map data
                    allMaps[index].text().then(tsxd => {
                        parseTsx(tsxd).then(d => {
                            datats._tilesetData = d;
                        });
                    });

                    return datats;
                });

                m.tilesets = upd;

                return m;
            })
    }

    drawGl(gl: WebGLRenderingContext) {
        let bitmap = this.tilesets[0]._tilesetData.getTile(0);
        loadTexture(gl, bitmap);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        const textureCoordinates = [
            0.0, 0.0, 1.0, 0.0,
            0.0, 1.0, 1.0, 1.0
        ];

        initTextureBuffer(gl, new Float32Array(textureCoordinates));

        //return textureCoordBuffer;

        /*function initTextureBuffer(gl) {
            const textureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
          
            const textureCoordinates = [
              // Front
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
              // Back
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
              // Top
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
              // Bottom
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
              // Right
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
              // Left
              0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            ];
          
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array(textureCoordinates),
              gl.STATIC_DRAW
            );
          
            return textureCoordBuffer;
          }*/
    }

    draw(ctx: CanvasRenderingContext2D) {

            for (const layer of this.layers) {
                for (let y = 0; y < layer.height; y++) {
                    for (let x = 0; x < layer.width; x++) {
                        let tileNumber = this.getAtXY(layer.id, x, y);
                        if (this.tilesets[0]._tilesetData) {
                            let bitmap = this.tilesets[0]._tilesetData.getTile(tileNumber);
                            console.log();
                            ctx.drawImage(bitmap, x * this.tilewidth, y * this.tileheight);
                            bitmap.close();
                        }
                    }
                }
            }
    }

    private getAtXY(layerId: number, x: number, y: number): number {
        let f = this.layers.filter(e => e.id == layerId).pop();
        if (Boolean(f)) {
            if (!(x > f!.width || y > f!.height)) {
                let index = (y * f!.width) + x;
                return f!.data[index];
            } else {
                //error, out of bounds
                return -1;
            }
        } else {
            return -1;
        }
    }
}

function basename(path: string) {
    return path.split(/[\\/]/).pop();
}

async function parseTsx(rawTsx: string): Promise<TiledTilesetData> {
    const parser = new DOMParser();
    let xmlDoc = parser.parseFromString(rawTsx, "text/xml");
    let data = new TiledTilesetData();
    Object.assign(data, parseXml(xmlDoc.documentElement));
    console.log(data);
    return data.load()
        .then(() => {
            return data;
        })
}

function parseXml(doc: Element): Object {
    let obj: any = {};

    for (const val of doc.attributes) {
        obj[val.nodeName] = val.nodeValue;
    }

    for (const val of doc.children) {

        switch (val.tagName) {
            case "properties":
                let id = val.parentElement!.id;
                for (const prop of val.children) {
                    obj[id] = parseXml(prop);

                    if (obj.id) {
                        delete obj.id;
                    }
                }
                break;

            default:
                obj = {
                    ...obj,
                    [val.tagName]: parseXml(val)
                };

                break;
        }
    }
    return obj;
}

function getXY(i: number, w: number, h: number) {
    let x = i % w;
    let y = Math.floor(i / h);
    return { x: x, y: y };
}