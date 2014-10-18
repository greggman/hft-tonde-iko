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
    '../bower_components/hft-utils/dist/imageutils',
  ], function(
    ImageUtils) {

  var cutImage = function(image, options) {
    var fn = options.fn || function(a) { return a; };
    if (image.slices) {
      var frames = [];
      var numFrames = image.slices.length ? image.slices.length : image.img.width / image.slices;
      numFrames = options.numFrames || numFrames;
      var x = 0;
      for (var jj = 0; jj < numFrames; ++jj) {
        var width = image.slices.length ? image.slices[jj] : image.slices;
        var frame = ImageUtils.cropImage(image.img, x, 0, width, image.img.height);
        frame = ImageUtils.scaleImage(frame, width * image.scale, frame.height * image.scale);
        frame = fn(frame, image.filter, image.preMult);
        frames.push(frame);
        x += width;
      }
      image.frames = frames;
    } else {
      image.frames = [fn(image.img, image.filter, image.preMult)];
    }
  };

  return {
    cutImage: cutImage,
  };
});




