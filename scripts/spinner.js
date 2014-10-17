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

/**
 * @module Spinner
 */
define(function() {

  var g;

  var setup = function() {
    if (!g) {
      g = {
      };
    }
  };


  // x,
  // y,
  // width,
  // height,
  // items,
  // currentItemIndex
  var Spinner = function(options) {
    this.width = options.width;
    this.height = options.height;
    this.items = options.items.slice();
    this.position = options.currentItemIndex || 0;
  };

  Spinner.prototype.draw = function(ctx) {
    if (!this.metalGrad) {
      this.metalGrad = ctx.createLinearGradient(0.000, 0, 0, this.height);
      for (var ii = -5; ii <= 5; ++ii) {
        var l = ii / 5 * Math.PI / 2;
        var p = (ii + 5) / 10;
        var s = Math.cos(l);
        var c = Math.floor((0.2 + s * 0.8) * 255);
        var color = "rgb(" + c + "," + c + "," + c + ")";
        this.metalGrad.addColorStop(p, color);
      }
    }

    ctx.fillStyle = this.metalGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = "20pt sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseAlign = "middle";
    ctx.fillStyle = "black";

    var numLinesAround = 5;
    var numItems = this.items.length;
    var start = (this.position + numItems * numLinesAround - numLinesAround) % numItems;
    var itemNdx = Math.floor(start);
    for (var ii = -numLinesAround + 1; ii <= numLinesAround + 1; ++ii) {
      ctx.save();

      var lerp = (ii - ((this.position + 1) % 1)) / (numLinesAround + 1);
      var ang  = lerp * Math.PI / 2;
      var s = Math.sin(ang);
      var c = Math.cos(ang);

      ctx.translate(this.width / 2, this.height / 2 + this.height / 2 * s);
      ctx.scale(1, Math.abs(c));
      ctx.fillText(this.items[itemNdx], 0, 0);

      ctx.restore();

      itemNdx = (itemNdx + 1) % numItems;
    }
    this.position += 0.02;
  };

  Spinner.prototype.move = function(startX, startY, destX, destY) {
  };

  Spinner.prototype.getCurrent = function() {
    return Math.floor(this.position + 0.5) % this.items.length;
  };

  return Spinner;
});
