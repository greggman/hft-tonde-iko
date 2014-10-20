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

// Start the main app logic.
requirejs([
    '../bower_components/hft-utils/dist/grid',
  ], function(
    Grid
  ) {

  function $(id) {
    return document.getElementById(id);
  }

  var gridSize = {
    container: $("manual"),
    columns: 6,
    rows: 1,
  };

  var settings = {
    shared: {
      canvasWidth: 1280,
      canvasHeight: 720,
    },
  };

  var settingsOptions = {
     numLocalPlayers:  { label: "local player", value: 1,      on: true,  },
     debug:            { label: "debug",        value: true,   on: true,  },
     fixedFramerate:   { label: "force 60fps",  value: 1 / 60, on: false, },
     showFPS:          { label: "show fps",     value: true,   on: false, },
     stressTest:       { label: "stress",       value: true,   on: false, },
     mute:             { label: "mute",         value: true,   on: false, },
     avatarNdx:        { label: "avatar 0",     value: 0,      on: false, },
     fullScreen:       { label: "fullscreen",   value: true,   on: false, },
     noExit:           { label: "no exit",      value: true,   on: false, },
  };

  Object.keys(settingsOptions).forEach(function(name) {
    var label = document.createElement("label");
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = settingsOptions[name].on ? true : undefined;
    input.id = "setting-" + name;
    label.appendChild(input);
    label.appendChild(document.createTextNode(settingsOptions[name].label));
    $("options").appendChild(label);
  });

  var grid = new Grid(gridSize);

  var makeWindowFunc = function(options) {
    var opt = {
      resizeable: "yes",
      scrollbars: "yes",
      menubar: "yes",
      toolbar: "yes",
      location: "yes",
      width: options.width,
      height: options.height,
      left: options.left,
      top: options.top,
    };

    var windowOptions = JSON.stringify(opt).replace(/[{}"]/g, "").replace(/\:/g,"=");

    return function() {
      window.open(options.url, options.title, windowOptions);
    };
  };

  var makeLaunchFunc = function(x, y, opt) {
    opt = opt || {};

    // use a width so there's at least 1 window left of space.
    var width  = opt.width  || window.screen.availWidth  / (gridSize.columns + 1) | 0;
    var height = opt.height || window.screen.availHeight / (gridSize.rows    + 1) | 0;

    settings.shared.fullWidth  = width  * gridSize.columns;
    settings.shared.fullHeight = height * gridSize.rows;

    settings.x         = x * width;
    settings.y         = y * height;
    settings.columns   = gridSize.columns;
    settings.rows      = gridSize.rows;
    settings.id        = "s" + x + "-" + y;
    settings.levelName = opt.levelName;

    Object.keys(settingsOptions).forEach(function(name) {
      settings[name] = $("setting-" + name).checked ? settingsOptions[name].value : undefined
    });

    var options = {
      width:  width,
      height: height,
      left:   opt.left || 10 + window.screen.availLeft + x * width,
      top:    opt.top  || 10 + window.screen.availTop  + y * height,
      url:    "realgame.html?settings=" + JSON.stringify(settings),
      title:  "view[" + x + "-" + y + "]",
    };

    return makeWindowFunc(options);
  };

  var removeChildren = function(element) {
    for(;;) {
      var child = element.firstChild;
      if (!child) {
        return;
      }
      element.removeChild(child);
    }
  };

  var fillGrid = function() {
    grid.forEach(function(element, x, y) {
      removeChildren(element);
      var div = document.createElement("div");
      div.className = "comp-button";
      div.appendChild(document.createTextNode("" + x + "-" + y));
      div.addEventListener('click',
        function(x, y) {
          return function() {
            makeLaunchFunc(x, y, {
              left: 10,
              top:  10,
              width: 1280,
              height: 720,
              levelName: "level" + x + "-" + y,
            })();
          };
        }(x, y), false);
      element.appendChild(div);
    });
  };
  fillGrid();

  var resizeGrid = function(dx, dy) {
    gridSize.columns = Math.max(1, gridSize.columns + dx);
    gridSize.rows    = Math.max(1, gridSize.rows    + dy);
    grid.setDimensions(gridSize.columns, gridSize.rows);
    fillGrid();
  };

  var launch = function(opt) {
    grid.forEach(function(element, x, y) {
      makeLaunchFunc(x, y, opt)();
    });
  };


  /*
  $("v-minus").addEventListener('click', function(e) { resizeGrid( 0, -1); }, false);
  $("v-plus" ).addEventListener('click', function(e) { resizeGrid( 0, +1); }, false);
  $("h-minus").addEventListener('click', function(e) { resizeGrid(-1,  0); }, false);
  $("h-plus" ).addEventListener('click', function(e) { resizeGrid(+1,  0); }, false);
  */

  var startController = function() {
    makeWindowFunc({
      url: "http://localhost:8080",
      title: "controller",
      left: window.screen.availWidth - 550,
      top: window.screen.availHeight - 450,
      width: 500,
      height: 400,
    })();
  };

  $("button1").addEventListener('click', function() {
    var oldCanvasWidth  = settings.shared.canvasWidth;
    var oldCanvasHeight = settings.shared.canvasHeight;
    settings.shared.canvasWidth  = undefined;
    settings.shared.canvasHeight = undefined;
    var oldColumns = gridSize.columns;
    var oldRows    = gridSize.rows;
    gridSize.columns = 3;
    gridSize.rows    = 1;
    grid.setDimensions(gridSize.columns, gridSize.rows);
    fillGrid();
    launch();
    gridSize.columns = oldColumns;
    gridSize.rows    = oldRows;
    grid.setDimensions(gridSize.columns, gridSize.rows);
    fillGrid();
    startController();
    settings.shared.canvasWidth  = oldCanvasWidth;
    settings.shared.canvasHeight = oldCanvasHeight;
  }, false);

  $("button2").addEventListener('click', startController, false);
});

