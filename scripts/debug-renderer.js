/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

define([
    '../bower_components/tdl/tdl/buffers',
    '../bower_components/tdl/tdl/fast',
    '../bower_components/tdl/tdl/math',
    '../bower_components/tdl/tdl/models',
    '../bower_components/tdl/tdl/primitives',
    '../bower_components/tdl/tdl/programs',
  ], function(
    Buffers,
    Fast,
    math,
    Models,
    Primitives,
    Programs) {

  var s_lineVertexShader = [
    "attribute vec2 position;  ",
    "attribute vec4 color;     ",
    "                          ",
    "uniform vec2 u_resolution;",
    "uniform vec2 u_offset;    ",
    "varying vec4 v_color;     ",
    "                          ",
    "void main() {             ",
    "  gl_Position = vec4(((position + u_offset) / u_resolution - 0.5) * vec2(2.0, -2.0), 0, 1);",
    "  v_color = color;        ",
    "}                         ",
  ].join("\n");

  var s_lineFragmentShader = [
    "precision mediump float;  ",
    "                          ",
    "varying vec4 v_color;     ",
    "                          ",
    "void main() {             ",
    "  gl_FragColor = v_color; ",
    "}                         ",
  ].join("\n");

  var makeLineModel = function() {
    var arrays = {
      position: new Primitives.AttribBuffer(2, [
          0,  0,
          1,  0,
      ]),
      color: new Primitives.AttribBuffer(4, [
          0xFF, 0, 0, 0xFF,
          0xFF, 0, 0, 0xFF,
      ], 'Uint8Array'),
    }
    var textures = {
    };
    var program = new Programs.Program(
        s_lineVertexShader, s_lineFragmentShader);
    return new Models.Model(program, arrays, textures, gl.LINES);
  };

  var DebugRenderer = function(debug) {
    if (!debug) {
      var noop = function() {};
      Object.keys(DebugRenderer.prototype).forEach(function(key) {
        this[key] = noop;
      }.bind(this));
      return;
    }
    this.model = makeLineModel();
    this.maxLines = 1;
    this.numLines = 0;
    this.allocate();
    this.reset();
    this.uniforms = {
      u_resolution: [0, 0],
      u_offset: [0, 0],
    };
  };

  DebugRenderer.prototype.allocate = function() {
    var newColors = new Primitives.AttribBuffer(4, this.maxLines * 2, 'Uint8Array');
    var newPositions = new Primitives.AttribBuffer(2, this.maxLines * 2);
    if (this.positions) {
      newColors.pushArray(this.colors);
      newPositions.pushArray(this.positions);
    }
    this.colors = newColors;
    this.positions = newPositions;
    this.color = [255, 0, 0, 255];
    this.lowestCleared = this.maxLines;
  };

  DebugRenderer.prototype.reset = function() {
    this.numLines = 0;
  };

  DebugRenderer.prototype.setColor = function(color) {
    this.color = [
      (color >> 24) & 0xFF,
      (color >> 16) & 0xFF,
      (color >>  8) & 0xFF,
      (color >>  0) & 0xFF,
    ];
  };

  DebugRenderer.prototype.addLine = function(x1, y1, x2, y2, opt_color) {
    if (this.numLines == this.maxLines) {
      this.maxLines *= 2;
      this.allocate();
    }
    if (opt_color) {
      this.setColor(opt_color);
    }
    var ndx = this.numLines++ * 2;
    this.positions.setElement(ndx    , [x1, y1]);
    this.positions.setElement(ndx + 1, [x2, y2]);
    this.colors.setElement(ndx    , this.color);
    this.colors.setElement(ndx + 1, this.color);
  };

  DebugRenderer.prototype.addPoint = function(x, y, opt_color) {
    this.addLine(x, y, x + 1, y + 1, opt_color);
  };

  DebugRenderer.prototype.addBox = function(x, y, w, h, opt_color) {
    this.addLine(x    , y    , x + w, y    , opt_color);
    this.addLine(x + w, y    , x + w, y + h);
    this.addLine(x + w, y + h, x    , y + h);
    this.addLine(x    , y + h, x    , y    );
  };

  DebugRenderer.prototype.addRect = function(r, opt_color) {
    this.addBox(r.x, r.y, r.w, r.h, opt_color);
  };

  DebugRenderer.prototype.addPlus = function(x, y, r, opt_color) {
    this.addLine(x - r, y    , x + r, y    , opt_color);
    this.addLine(x    , y + r, x    , y + r);
  };

  DebugRenderer.prototype.addX = function(x, y, r, opt_color) {
    this.addLine(x - r, y - r, x + r, y + r, opt_color);
    this.addLine(x - r, y + r, x + r, y - r);
  };

  DebugRenderer.prototype.addCircle = function(x, y, r, opt_color) {
    var segments = 16;
    var oldX = 0;
    var oldY = r;
    if (opt_color) {
      this.setColor(opt_color);
    }
    for (var ii = 1; ii <= segments; ++ii) {
      var angle = Math.PI * 2 * ii / segments;
      var x = Math.sin(angle) * r;
      var y = Math.cos(angle) * r;
      this.addLine(oldX, oldY, x, y);
      oldX = x;
      oldY = y;
    }
  };

  DebugRenderer.prototype.draw = function(offset) {
    if (this.numLines) {
      var newLowestCleared = this.numLines;
      while (this.numLines < this.lowestCleared) {
        this.addLine(-1, -1, -1, -1);
      }
      this.lowestCleared = newLowestCleared;
      this.model.setBuffer('position', this.positions);
      this.model.setBuffer('color', this.colors);
      this.uniforms.u_resolution[0] = gl.canvas.width;
      this.uniforms.u_resolution[1] = gl.canvas.height;
      this.uniforms.u_offset[0] = offset.x;
      this.uniforms.u_offset[1] = offset.y;
      this.model.drawPrep(this.uniforms);
      this.model.draw();
      this.reset();
    }
  };

  return DebugRenderer;

});
