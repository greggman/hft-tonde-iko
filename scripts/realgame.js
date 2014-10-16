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

function $(id) {
  return document.getElementById(id);
}

// Start the main app logic.
requirejs(
  [ 'hft/gameserver',
    'hft/gamesupport',
    'hft/localnetplayer',
    'hft/misc/input',
    'hft/misc/misc',
    'hft/misc/strings',
    '../bower_components/tdl/tdl/fullscreen',
    '../bower_components/tdl/tdl/textures',
    '../bower_components/tdl/tdl/webgl',
    '../bower_components/hft-utils/dist/audio',
    '../bower_components/hft-utils/dist/entitysystem',
    '../bower_components/hft-utils/dist/imageloader',
    '../bower_components/hft-utils/dist/imageutils',
    '../bower_components/hft-utils/dist/spritemanager',
    './collectable-manager',
    './door',
    './debug-renderer',
    './levelloader',
    './levelmanager',
    './particlesystemmanager',
    './playermanager',
    './portal',
    './scoremanager',
  ], function(
    GameServer,
    GameSupport,
    LocalNetPlayer,
    Input,
    Misc,
    Strings,
    Fullscreen,
    Textures,
    WebGL,
    AudioManager,
    EntitySystem,
    ImageLoader,
    ImageUtils,
    SpriteManager,
    CollectableManager,
    Door,
    DebugRenderer,
    LevelLoader,
    LevelManager,
    ParticleSystemManager,
    PlayerManager,
    Portal,
    ScoreManager) {

  var g_debug = false;
  var g_services = {};
window.s = g_services;

  var g_entitySystem = new EntitySystem();
  g_services.entitySystem = g_entitySystem;
  var g_drawSystem = new EntitySystem('draw');
  g_services.drawSystem = g_drawSystem;
  var g_playerManager = new PlayerManager(g_services);
  g_services.playerManager = g_playerManager;
  g_services.misc = Misc;
  var stop = false;

  // You can set these from the URL with
  // http://path/gameview.html?settings={name:value,name:value}
  var globals = {
    haveServer: true,
    numLocalPlayers: 0,  // num players when local (ie, debugger)
    stressPlayerCount: 50,
    debug: false,
    tileInspector: false,
    showState: false,
    moveAcceleration: 500,
    maxVelocity: [200, 1000],
    jumpDuration: 0.2,        // how long the jump velocity can be applied
    jumpVelocity: -350,
    minStopVelocity: 25,      // below this we're idling
    stopFriction: 0.95,       // amount of velocity to keep each frame
    gravity: 1200,
    frameCount: 0,
    idleAnimSpeed: 4,
    moveAnimSpeed: 0.2,
    coinAnimSpeed: 10,
    coinAnimSpeedRange: 2,
    jumpFirstFrameTime: 0.1,
    fallTopAnimVelocity: 100,
    scale: 1,
    minBonusTime: 60,
    maxBonusTime: 180,
    bonusSpeed: 4,  // every 4 frames (add a coin every N frames)

    doorOpenDuration: 0.1,
    doorWaitTime: 5,    // time 1 player has to wait for door.
    doorOpenTime: 0.25, // time door stays open

    drawOffset: {},
    duckBlueRange: [180 / 360, 275 / 360],  // color range for colorizing duck but not beak
  };
window.g = globals;

  function startLocalPlayers() {
    var localPlayers = [];
    var count = 0;

    if (globals.stressTest) {
      globals.numLocalPlayers = Math.max(globals.numLocalPlayers, globals.stressPlayerCount)
    }

    var addLocalPlayer = function() {
      var netPlayer = new LocalNetPlayer();
      var player = g_playerManager.startPlayer(netPlayer, "Player" + (localPlayers.length + 1));
      localPlayers.push({
        player: player,
        netPlayer: netPlayer,
        leftRight: 0,
        oldLeftRight: 0,
        jump: false,
      });
      var levelManager = g_services.levelManager;
      var level = levelManager.getLevel();
      var p = levelManager.getRandomOpenPosition();
      player.position[0] = p.x;
      player.position[1] = p.y;
    };

    var removeLocalPlayer = function(playerId) {
      if (playerId < localPlayers.length) {
        localPlayers[playerId].netPlayer.sendEvent('disconnect');
        localPlayers.splice(playerId, 1);
      }
    };

    for (var ii = 0; ii < globals.numLocalPlayers; ++ii) {
      addLocalPlayer();
    }

    if (globals.stressTest) {
      setInterval(function() {
        for (var ii = 0; ii < 5; ++ii) {
          var lp = localPlayers[Misc.randInt(localPlayers.length - 1) + 1];
          if (lp) {
            lp.netPlayer.sendEvent('jump', {
              jump: Math.random() > 0.5,
            });
          }
        }
      }, 20);
    }

    var handleLeftRight = function(playerId, pressed, bit) {
      var localPlayer = localPlayers[playerId];
      if (localPlayer) {
        localPlayer.leftRight = (localPlayer.leftRight & ~bit) | (pressed ? bit : 0);
        if (localPlayer.leftRight != localPlayer.oldLeftRight) {
          localPlayer.oldLeftRight = localPlayer.leftRight;
          localPlayer.netPlayer.sendEvent('move', {
              dir: (localPlayer.leftRight & 1) ? -1 : ((localPlayer.leftRight & 2) ? 1 : 0),
          });
        }
      }
    };

    var handleJump = function(playerId, pressed) {
      var localPlayer = localPlayers[playerId];
      if (localPlayer) {
        if (localPlayer.jump != pressed) {
          localPlayer.jump = pressed;
          localPlayer.netPlayer.sendEvent('jump', {
              jump: pressed,
          });
        }
      }
    };

    var handleTestSound = (function() {
      var soundNdx = 0;
      var soundIds;

      return function(pressed) {
        if (!soundIds) {
          soundIds = g_services.audioManager.getSoundIds();
        }
        if (pressed) {
          var id = soundIds[soundNdx];
          console.log("play: " + id);
          g_services.audioManager.playSound(id);
          soundNdx = (soundNdx + 1) % soundIds.length;
        }
      };
    }());

    var keys = { };
    keys[Input.cursorKeys.kLeft]  = function(e) { handleLeftRight(0, e.pressed, 0x1); }
    keys[Input.cursorKeys.kRight] = function(e) { handleLeftRight(0, e.pressed, 0x2); }
    keys["Z"]                     = function(e) { handleJump(0, e.pressed);           }
    keys["A"]                     = function(e) { handleLeftRight(1, e.pressed, 0x1); }
    keys["D"]                     = function(e) { handleLeftRight(1, e.pressed, 0x2); }
    keys["W"]                     = function(e) { handleJump(1, e.pressed);           }
    keys["X"]                     = function(e) { handleTestSound(e.pressed);         }
    keys[187]                     = function(e) { addLocalPlayer();                   }
    keys[189]                     = function(e) { removeLocalPlayer(2);               }
    Input.setupKeys(keys);
  }

  Misc.applyUrlSettings(globals);

  var canvas = $("playfield");
  if (globals.shared.canvasWidth ) { globals.resize = false; canvas.width  = globals.shared.canvasWidth;  }
  if (globals.shared.canvasHeight) { globals.resize = false; canvas.height = globals.shared.canvasHeight; }
  var gl = WebGL.setupWebGL(canvas, {alpha:false, antialias: false}, function() {});
  g_services.spriteManager = new SpriteManager();
  g_services.debugRenderer = new DebugRenderer(globals.debug);
  g_services.particleSystemManager = new ParticleSystemManager();

  var resize = function() {
    if (!globals.resizeOnce || (globals.resize !== false && Misc.resize(canvas))) {
      if (!globals.resizeOnce && globals.resize !== false) {
        canvas.style.width  = "100%";
        canvas.style.height = "100%";
      }
      globals.resizeOnce = true;
      // Figure out which level is the play one.
      var playLevel;
      globals.level.layers.forEach(function(layer) {
        if (layer.name == "Tile Layer 1" ||
            Strings.startsWith(layer.name.toLowerCase(), "play")) {
          playLevel = layer;
        }
      });
      if (!playLevel) {
        playLevel = globals.level.layers[globals.level.layers.length / 2 | 0];
      }
      globals.playLevel = playLevel;

      g_services.levelManager.reset(canvas.width, canvas.height, globals.playLevel);
      if (!globals.level.layers.length) {
        globals.level.layers.push(g_services.levelManager.level);
        g_services.levelManager.level.name = "foo";
      }
      g_services.playerManager.forEachPlayer(function(player) {
        player.reset();
      });
    }
  };
  g_services.globals = globals;
  g_services.gameSupport = GameSupport;

  if (globals.tileInspector) {
    var element = document.createElement("div");
    var s = element.style;
    s.zIndex = 20000;
    s.position = "absolute";
    s.backgroundColor = "rgba(0,0,0,0.6)";
    s.padding = "1em";
    s.color = "white";
    s.pointerEvents = "none";
    document.body.appendChild(element);
    $("outer").addEventListener('mousemove', function(e) {
      var pos = Input.getRelativeCoordinates(e.target, e);
      var level = g_levelManager.getLevel();
      var offset = level.getTransformOffset(levelCtx);
      var x = pos.x - offset.x;
      var y = pos.y - offset.y;
      var tileId = level.getTileByPixel(x, y);
      var tileInfo = g_levelManager.getTileInfo(tileId);
      var px = (canvas.clientLeft + pos.x) + "px";
      var py = (canvas.clientTop  + pos.y) + "px";
      s.left = px;
      s.top  = py;
      element.innerHTML = "<pre>" +
        "x: " + x + "\n" +
        "y: " + y + "\n" +
        "tileId:" + tileId + " (" + String.fromCharCode(tileId) + ")";
    }, false);
  };

  var Status = function() {
    var lines = [];
    this.addMsg = function(msg) {
      lines.push(msg);
    };
    this.draw = function() {
      GameSupport.setStatus(lines.join("\n"));
      lines = [];
    };
  };
  g_services.status = new Status();

  var createTexture = function(img) {
    var tex = Textures.loadTexture(img);
    tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };

  g_services.createTexture = createTexture;
  // colorize: number of colors to make
  // slizes: number = width of all slices, array = width of each consecutive slice
  var images = {
    idle:  { url: "assets/spr_idle.png",    scale: 2, slices: 16, },
    move:  { url: "assets/spr_run.png",     scale: 2, slices: 16, },
    jump:  { url: "assets/spr_jump.png",    scale: 2, slices: [16, 17, 17, 18, 16, 16] },
    brick: { url: "assets/bricks.png",      },
    coin:  { url: "assets/coin_anim.png",   scale: 4, slices: 8, },
    door:  { url: "assets/door.png",        },
    "switch":  { url: "assets/switch.png",  },
  };
  g_services.images = images;
  var processImages = function() {
    Object.keys(images).forEach(function(name) {
      var image = images[name];
      var frames = [];
      if (image.slices) {
        var numFrames = image.slices.length ? image.slices.length : image.img.width / image.slices;
        var x = 0;
        for (var jj = 0; jj < numFrames; ++jj) {
          var width = image.slices.length ? image.slices[jj] : image.slices;
          var frame = ImageUtils.cropImage(image.img, x, 0, width, image.img.height);
          frame = ImageUtils.scaleImage(frame, width * image.scale, frame.height * image.scale);
          frame = createTexture(frame);
          frames.push(frame);
          x += width;
        }
        image.frames = frames;
      } else {
        image.frames = [createTexture(image.img)];
      }
    });

    var startGame = function() {
      var tileset = {
        tileWidth: 32,
        tileHeight: 32,
        tilesAcross: images.brick.img.width / 32,  // tiles across set
        tilesDown: images.brick.img.height / 32,   // tiles down set
        texture: images.brick.frames[0],
      };
      var g_levelManager = new LevelManager(g_services, tileset);
      g_services.levelManager = g_levelManager;
      resize();

      var server;
      if (globals.haveServer) {
        var server = new GameServer({
          allowMultipleGames: true,
          id: globals.id,
          master: globals.levelName && globals.levelName == "level0-0",
        });
        g_services.server = server;
        server.addEventListener('playerconnect', g_playerManager.startPlayer.bind(g_playerManager));
      }
      GameSupport.init(server, globals);

      new CollectableManager(g_services);

      // create portals
      var level = g_levelManager.getLevel();
      [
        {type: "teleport", portalType: 0, constructor: Portal},
        {type: "end",      portalType: 1, constructor: Portal},
        {type: "door",                    constructor: Door},
      ].forEach(function(type) {
        var teleports = level.getThings(type.type);
        if (teleports) {
          Object.keys(teleports).forEach(function(key) {
            teleports[key].forEach(function(teleport) {
              new (type.constructor)(
                g_services,
                teleport,
                type.portalType);
            });
          });
        }
      });

      if (globals.levelName == "level5-0") {
        $("score").style.display = "block";
        g_services.scoreManager = new ScoreManager(
          g_services, $("top-today"), $("top-hour"), $("top-10mins"));
      }

      startLocalPlayers();

      GameSupport.run(globals, mainloop);
    };

    document.title = "Tonde-Iko: " + (globals.levelName ? globals.levelName : "*level*");
    if (globals.levelName) {
      LevelLoader.load(globals.debug, gl, "assets/" + globals.levelName + ".json", function(err, level) {
        if (err) {
          throw err;
        }
        globals.level = level;
        startGame();
      });
    } else {
      globals.level = {
        layers:[],
        backgroundColor: [0,0,0,1],
      };
      startGame();
    };
  };

  ImageLoader.loadImages(images, processImages);

  gl.clearColor = function(clearColor) {
    return function(r,g,b,a) {
      clearColor(r,g,b,a);
    };
  }(gl.clearColor.bind(gl));
  gl.clear = function(clear) {
    return function(b) {
      clear(b);
    }
  }(gl.clear.bind(gl));

  var mainloop = function() {
    resize();
    g_services.levelManager.getDrawOffset(globals.drawOffset);
    g_services.entitySystem.processEntities();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.15, 0.15, 0.15, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var level = g_services.levelManager.getLevel();
    var xtraX = ((gl.canvas.width  - level.levelWidth ) / 2 | 0);
    var xtraY = ((gl.canvas.height - level.levelHeight) / 2 | 0);
    gl.scissor(xtraX, xtraY, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(
        globals.level.backgroundColor[0],
        globals.level.backgroundColor[1],
        globals.level.backgroundColor[2],
        globals.level.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);

    var layerNdx = 0;
    var layers    = globals.level.layers;
    var numLayers = layers.length;
    if (globals.playLevel) {
      // Draw all layers before and including playLevel
      for (; layerNdx < numLayers && layer !== globals.playLevel; ++layerNdx) {
        var layer = layers[layerNdx];
        layer.draw(g_services.levelManager, globals);
      }
    }
    g_services.drawSystem.processEntities();
    g_services.spriteManager.draw();
    if (globals.playLevel) {
      // Draw the remaining layers
      for(; layerNdx < numLayers; ++layerNdx) {
        var layer = layers[layerNdx];
        layer.draw(g_services.levelManager, globals);
      }
    }
    g_services.particleSystemManager.draw(globals.drawOffset);

    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0,0,0,1);
    if (xtraY > 0) {
      gl.scissor(0, 0, gl.canvas.width, xtraY);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.scissor(0, gl.canvas.height - xtraY, gl.canvas.width, xtraY);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    if (xtraX > 0) {
      gl.scissor(0, 0, xtraX, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.scissor(gl.canvas.width - xtraX, 0, xtraX, gl.canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.disable(gl.SCISSOR_TEST);

    g_services.debugRenderer.draw(globals.drawOffset);
    g_services.status.draw();
  };

  var sounds = {
    coin:              { jsfx: ["square",0.0000,0.4000,0.0000,0.0240,0.4080,0.3480,20.0000,909.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.2540,0.1090,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    jump:              { jsfx: ["square",0.0000,0.4000,0.0000,0.1800,0.0000,0.2040,20.0000,476.0000,2400.0000,0.3360,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.5000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    coinland:          { jsfx: ["square",0.0000,0.4000,0.0000,0.0520,0.3870,0.1160,20.0000,1050.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    bonkhead:          { jsfx: ["square",0.0000,0.4000,0.0000,0.0120,0.4500,0.1140,20.0000,1218.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.5140,0.2350,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    land:              { jsfx: ["sine",0.0000,0.4000,0.0000,0.1960,0.0000,0.1740,20.0000,1012.0000,2400.0000,-0.7340,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3780,0.0960,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000] , },
  };
  var audioManager = new AudioManager(globals.mute ? {} : sounds);
  g_services.audioManager = audioManager;
});


