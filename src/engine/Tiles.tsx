export class Tiles {
  readonly url: string;
  readonly img: HTMLImageElement;
  readonly spriteSize: number;
  readonly length: number;

  constructor(url: string, img: HTMLImageElement, spriteSize: number) {
    this.url = url;
    this.img = img;
    this.spriteSize = spriteSize;
    this.length = (img.width / spriteSize) * (img.height / spriteSize);
  }

  static async from({
    url,
    spriteSize,
  }: {
    url: string;
    spriteSize: number;
  }): Promise<Tiles> {
    return new Promise((res) => {
      const img = document.createElement("img");
      img.onload = function () {
        res(new Tiles(url, img, spriteSize));
      };
      // triggers onload event (after it loads of course)
      // img.src = "//via.placeholder.com/350x150";
      img.src = url;
    });
  }

  __getSerialRepresentation() {
    return {
      url: this.url,
      spriteSize: this.spriteSize,
    };
  }

  drawSprite(
    num: number,
    [x, y]: [number, number],
    ctx: CanvasRenderingContext2D
  ) {
    // const cols = this.img.width / this.spriteSize;
    const srcX = (num * this.spriteSize) % this.img.width;
    // const rows = this.img.height / this.spriteSize;
    const srcY =
      Math.floor((num * this.spriteSize) / this.img.width) * this.spriteSize;

    ctx.drawImage(
      this.img,
      srcX,
      srcY,
      this.spriteSize,
      this.spriteSize,
      x,
      y,
      this.spriteSize,
      this.spriteSize
    );
  }
}
