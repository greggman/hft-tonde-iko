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
  ], function() {

  var emod = function(x, n) {
    return x >= 0 ? (x % n) : ((n - (-x % n)) % n);
  };

  var unitdiv = function(x, n) {
    return x >= 0 ? (x / n | 0) : ((x / n | 0) - 1) ;
  }

  var lineIntersection = function(p0X, p0Y, p1X, p1Y, p2X, p2Y, p3X, p3Y, intersection) {
    var s1X = p1X - p0X;
    var s1Y = p1Y - p0Y;
    var s2X = p3X - p2X;
    var s2Y = p3Y - p2Y;

    var s = (-s1Y * (p0X - p2X) + s1X * (p0Y - p2Y)) / (-s2X * s1Y + s1X * s2Y);
    var t = ( s2X * (p0Y - p2Y) - s2Y * (p0X - p2X)) / (-s2X * s1Y + s1X * s2Y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      // Collision detected
      intersection = intersection || {};
      intersection.x = p0X + (t * s1X);
      intersection.y = p0Y + (t * s1Y);
      return true;
    }
  };

  var normalize = function(x, y, dest) {
    dest = dest || {};
    var len = Math.sqrt(x * x + y * y);
    dest.x = x / len;
    dest.y = y / len;
    return dest;
  };

  var dot = function(v0X, v0Y, v1x, v1y) {
    return v0X * v1x + v0Y * v1y;
  };

  var clamp = function(value, min, max) {
    return Math.min(max, Math.max(min, value));
  };

  var clampedLerp = function(min, max, lerp0to1) {
    return min + (max - min) * clamp(lerp0to1, 0, 1);
  };

  var clampedLerpRange = function(min, max, range, value) {
    return clampedLerp(min, max, value / range);
  };


  var Rect = function(x, y, w, h) {
    if (w < 0) {
      x = x + w;
      w = -w;
    }
    if (h < 0) {
      y = y + h;
      h = -h;
    }
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  };

  Rect.prototype.union = function(other) {
    var xMax = Math.max(this.x + this.w, other.x + other.w);
    var yMax = Math.max(this.y + this.h, other.y + other.h);
    this.x = Math.min(this.x, other.x);
    this.y = Math.min(this.y, other.y);
    this.w = xMax - this.x;
    this.h = yMax - this.y;
  };

  Rect.prototype.clone = function() {
    return new Rect(this.x, this.y, this.w, this.h);
  };

  Rect.prototype.isPointIn = function(x, y) {
    return x >= this.x && x < this.x + this.w &&
           y >= this.y && y < this.y + this.h;
  };

  return {
    clamp: clamp,
    clampedLerp: clampedLerp,
    clampedLerpRange: clampedLerpRange,
    emod: emod,
    unitdiv: unitdiv,
    lineIntersection: lineIntersection,
    normalize: normalize,
    dot: dot,
    Rect: Rect,
  };

});


