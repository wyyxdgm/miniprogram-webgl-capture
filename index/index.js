const vs = `
  precision mediump float;

  attribute vec2 vertPosition;
  attribute vec3 vertColor;
  varying vec3 fragColor;

  void main() {
    gl_Position = vec4(vertPosition, 0.0, 1.0);
    fragColor = vertColor;
  }
`

const fs = `
  precision mediump float;

  varying vec3 fragColor;
  void main() {
    gl_FragColor = vec4(fragColor, 1.0);
  }
`

const triangleVertices = [
  0.0, 0.5, 1.0, 1.0, 0.0,
  -0.5, -0.5, 0.7, 0.0, 1.0,
  0.5, -0.5, 0.1, 1.0, 0.6
];

Page({
  data: {},
  onLoad() {
    const query = wx.createSelectorQuery()
    query.select('#myCanvas').node().exec((res) => {
      const canvas = res[0].node
      this.canvas = canvas;
      this._render(canvas)
      const gl = canvas.getContext('webgl')
      console.log(gl)
    })
    query.select('#captureCanvas').node().exec((res) => {
      console.log(res);
      const captureCanvas = res[1].node
      this.data.captureCanvas = captureCanvas;
      this.data.captureCanvasContext = captureCanvas.getContext('2d');
      console.log(this.data.captureCanvas, this.data.captureCanvasContext,)
    })
  },

  _render(canvas) {
    const gl = canvas.getContext('webgl')
    console.log(gl)
    if (!gl) {
      console.error('gl init failed', gl)
      return
    }
    this.gl = gl;
    gl.viewport(0, 0, 300, 300)
    const vertShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertShader, vs)
    gl.compileShader(vertShader)

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragShader, fs)
    gl.compileShader(fragShader)

    const prog = gl.createProgram()
    gl.attachShader(prog, vertShader)
    gl.attachShader(prog, fragShader)
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const draw = () => {
      const triangleVertexBufferObject = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW)

      const positionAttribLocation = gl.getAttribLocation(prog, 'vertPosition')
      const colorAttribLocation = gl.getAttribLocation(prog, 'vertColor')
      gl.vertexAttribPointer(
        positionAttribLocation,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
      )
      gl.vertexAttribPointer(
        colorAttribLocation,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
      )

      gl.enableVertexAttribArray(positionAttribLocation)
      gl.enableVertexAttribArray(colorAttribLocation)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      canvas.requestAnimationFrame(draw)
    }

    canvas.requestAnimationFrame(draw)
  },

  takePhoto(e) {

    return new Promise((resolve, reject) => {
      //webgl截屏直接重用当前canvas，因为尺寸肯定比最终要画的webgl大，所以就算iOS端可能canvas的渲染分辨率没有原生那么大，也差不多够大了。
      //poster组件会先把canvas放到屏幕外（left属性），等到load结束再拿回来。

      let gl = this.gl;
      let [w, h] = [gl.drawingBufferWidth, gl.drawingBufferHeight];

      // 3d截图
      let readPixelBuffer = new Uint8Array(w * h * 4);
      let buffer2 = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, readPixelBuffer);

      const captureCanvas = this.data.captureCanvas;
      debugger
      const context = this.data.captureCanvasContext;
      let imageData = context.createImageData(w, h);
      // 画到canvas上
      captureCanvas.width = w;
      captureCanvas.height = h;
      imageData.data.set(new Uint8ClampedArray(readPixelBuffer));
      context.clearRect(0, 0, w, h);
      context.putImageData(imageData, 0, 0);

      //保存到相册
      // wx.canvasToTempFilePath({
      //   canvas: captureCanvas,
      //   fileType: "png",
      //   x: 0,
      //   y: 0,
      //   width: w,
      //   height: h,
      //   destWidth: w,
      //   destHeight: h,

      //   success: result => {
      //     this.image = captureCanvas.createImage();
      //     this.image.src = result.tempFilePath;
      //     this.image.onload = () => resolve();
      //     this.image.onerror = reject;
      //   },
      //   fail: reject,
      // });
    });
  }
})
