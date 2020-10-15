import * as d3 from 'd3-scale';
import {format} from 'date-fns';

export class Chart {

  constructor(container) {
    this.axisPadding = 30;
    this.width = parseInt(container.style.width);
    this.height = parseInt(container.style.height);
    this.canvas = document.createElement('canvas');
    this.dpi = window.devicePixelRatio || 1;
    this.canvas.setAttribute("width", this.dpi * parseInt(container.style.width) + 'px');
    this.canvas.setAttribute("height", this.dpi * parseInt(container.style.height) + 'px');
    this.canvas.style.width = parseInt(container.style.width) + 'px';
    this.canvas.style.height = parseInt(container.style.height) + 'px';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.hdpi();
    this.setStyles({
      chartBackgroundColor: "#202f42",
      gridColor: "#29394d",
      labelsColor: "#bdc0c3",
      currentLabelColor: "#ffffff",
      upColor: "#09c9be",
      downColor: "#ff534f",
      axisColor: "#999999",
    });
  }

  setData(data) {
    if (data.length === 0) {
      throw new Error('No data available');
    }
    this.data = data;
    let {date: minX, date: maxX, open: minY, close: maxY} = data[0];
    if(minY > maxY) { minY = data[0].close; maxY = data[0].open}
    for(let i = 1; i < data.length; ++i) {
      minY = Math.min(data[i].open, data[i].close, data[i].high, data[i].low, minY);
      maxY = Math.max(data[i].open, data[i].close, data[i].high, data[i].low, maxY);
      minX = (minX > data[i].date) ? data[i].date : minX;
      maxX = (maxX < data[i].date) ? data[i].date : maxX;
    }
    minY *= 0.9;
    maxY *= 1.1;
    this.yScale = d3.scaleLinear()
      .range([this.height - this.axisPadding, 0])
      .domain([minY, maxY]);
    this.xScale = d3.scaleTime()
      .range([this.axisPadding, this.width])
      .domain([Date.parse(minX), Date.parse(maxX)]);
  }

  setStyles({chartBackgroundColor, gridColor, labelsColor, currentLabelColor, upColor, downColor, axisColor}) {
    this.chartBackgroundColor = chartBackgroundColor || this.chartBackgroundColor;
    this.gridColor = gridColor || this.gridColor;
    this.labelsColor = labelsColor || this.labelsColor;
    this.currentLabelColor = currentLabelColor || this.currentLabelColor;
    this.upColor = upColor || this.upColor;
    this.downColor = downColor || this.downColor;
    this.axisColor = axisColor || this.axisColor;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = this.chartBackgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.drawScales();
    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.rect(this.axisPadding, 0, this.width, this.height - this.axisPadding);
    this.ctx.clip();
    const distance = (this.width - this.axisPadding) / (this.data.length - 1);
    for(let i = 0; i < this.data.length; ++i) {
      const middleX = this.axisPadding + i * distance;
      const green = this.data[i].open < this.data[i].close;

      this.ctx.beginPath();
      const widthK = 0.6;
      this.ctx.fillStyle = green ? this.upColor : this.downColor;
      this.ctx.strokeStyle = green ? this.upColor : this.downColor;
      this.ctx.moveTo(middleX - distance * widthK/2, this.yScale(this.data[i].open));
      this.ctx.lineTo(middleX + distance * widthK/2, this.yScale(this.data[i].open));
      this.ctx.lineTo(middleX + distance * widthK/2, this.yScale(this.data[i].close));
      this.ctx.lineTo(middleX - distance * widthK/2, this.yScale(this.data[i].close));
      this.ctx.lineTo(middleX, this.yScale(this.data[i].close));
      this.ctx.lineTo(middleX, this.yScale(this.data[i].high));
      this.ctx.lineTo(middleX, this.yScale(this.data[i].low));
      this.ctx.lineTo(middleX, this.yScale(this.data[i].close));
      this.ctx.lineTo(middleX - distance * widthK/2, this.yScale(this.data[i].close));
      this.ctx.stroke();
      this.ctx.fill();
    }
    this.drawCurrentLine();
  }

  hdpi() {
    this.ctx.scale(this.dpi, this.dpi);
  }

  drawScales() {
    this.drawScaleX();
    this.drawScaleY();
  }

  drawScaleY() {
    const distance = (this.height - this.axisPadding) / 10;
    for(let i = 0; i < 10; ++i) {
      const y = i * distance;
      this.ctx.beginPath();
      this.ctx.moveTo(this.axisPadding, y);
      this.ctx.lineTo(this.axisPadding - (i % 2 === 0 ? 4 : 3), y);
      this.ctx.stroke();
      this.ctx.closePath();
      if (i !== 0 && i !== 10) {
        if (i % 2 === 0) {
          this.ctx.fillStyle = this.labelsColor;
          this.ctx.font = "8px sans-serif";
          this.ctx.textAlign = "right";
          this.ctx.textBaseline = "middle";
          this.ctx.fillText(this.yScale.invert(y).toFixed(2), this.axisPadding - 10, y);
        }
        // draw grid
        this.ctx.beginPath();
        const oldStrokeStyle = this.ctx.strokeStyle;
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.moveTo(this.axisPadding, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
        this.ctx.strokeStyle = oldStrokeStyle;
        this.ctx.closePath();
      }
      this.ctx.beginPath();
      this.ctx.strokeStyle = this.axisColor;
      this.ctx.moveTo(this.axisPadding, 0);
      this.ctx.lineTo(this.axisPadding, this.height - this.axisPadding);
      this.ctx.stroke();
      this.ctx.closePath();
    }
  }

  drawScaleX() {
    this.ctx.strokeStyle = this.axisColor;
    const distance = (this.width - this.axisPadding) / (this.data.length - 1);
    for(let i = 0; i < this.data.length; ++i) {
      const x = this.axisPadding + i * distance;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.height - this.axisPadding);
      this.ctx.lineTo(x, this.height - this.axisPadding + (i % 2 === 0 ? 4 : 3));
      this.ctx.stroke();

      if (i % 2 === 0) {
        this.ctx.fillStyle = this.labelsColor;
        this.ctx.font = "8px sans-serif";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "top";
        const date = format(this.xScale.invert(x), 'H:mm');
        this.ctx.fillText(date, x, this.height - this.axisPadding + 10);
        this.ctx.closePath();
      }

      // draw grid
      this.ctx.beginPath();
      const oldStrokeStyle = this.ctx.strokeStyle;
      this.ctx.strokeStyle = this.gridColor;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height - this.axisPadding);
      this.ctx.stroke();
      this.ctx.strokeStyle = oldStrokeStyle;
      this.ctx.closePath();
    }
    this.ctx.beginPath();
    this.ctx.moveTo(this.axisPadding, this.height - this.axisPadding);
    this.ctx.lineTo(this.width, this.height - this.axisPadding);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawCurrentLine() {
    this.ctx.restore();
    const value = this.data[this.data.length - 1].close;
    const green = this.data[this.data.length - 1].open < this.data[this.data.length - 1].close;
    this.ctx.fillStyle = green ? this.upColor : this.downColor;
    this.ctx.strokeStyle = green ? this.upColor : this.downColor;
    this.ctx.beginPath();
    this.ctx.setLineDash([5, 10]);
    this.ctx.moveTo(this.axisPadding, this.yScale(value));
    this.ctx.lineTo(this.width, this.yScale(value));
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.beginPath();
    this.ctx.lineCap = "round";
    this.ctx.setLineDash([]);
    this.ctx.moveTo(this.axisPadding, this.yScale(value));
    this.ctx.lineTo(this.axisPadding - 5, this.yScale(value) + 5);
    this.ctx.lineTo(2, this.yScale(value) + 5);
    this.ctx.lineTo(2, this.yScale(value) - 5);
    this.ctx.lineTo(this.axisPadding - 5, this.yScale(value) - 5);
    this.ctx.lineTo(this.axisPadding, this.yScale(value));
    this.ctx.fill();
    this.ctx.fillStyle = this.currentLabelColor;
    this.ctx.textAlign = "right";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(value.toFixed(2), this.axisPadding - 10, this.yScale(value));
    this.ctx.lineCap = "butt";
    this.ctx.closePath();
  }

}
