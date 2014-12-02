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
    '../bower_components/hft-utils/dist/levelloader',
    '../bower_components/hft-utils/dist/spritemanager',
    './avatars',
    './collectable-manager',
    './door',
    './ball',
    './gift',
    './coingen',
    './flyingportal',    
    './debug-renderer',
    './image-cutter',
    './level',
    './levelmanager',
    './particleeffectmanager',
    './particleemitter',
    './particlesystemmanager',
    './playermanager',
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
    LevelLoader,
    SpriteManager,
    avatars,
    CollectableManager,
    Door,
    Ball,
    Gift,
    CoinGen,
    FlyingPortal,
    DebugRenderer,
    ImageCutter,
    Level,
    LevelManager,
    ParticleEffectManager,
    ParticleEmitter,
    ParticleSystemManager,
    PlayerManager,
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
    moveAcceleration: 1000,
    maxVelocity: [200, 1000],
    jumpDuration: 0.2,        // how long the jump velocity can be applied
    jumpVelocity: -350,
    minStopVelocity: 25,      // below this we're idling
    stopFriction: 0.60,       // amount of velocity to keep each frame
    gravity: 1200,
    ladderGravity: 600,
    ladderMaxVelocityY: 100,
    frameCount: 0,
    coinAnimSpeed: 10,
    coinAnimSpeedRange: 2,

    jumpFirstFrameTime: 0.1,
    fallTopAnimVelocity: 100,
    scale: 1,
    minBonusTime: 60,
    maxBonusTime: 180,
    bonusSpeed: 4,  // every 4 frames (add a coin every N frames)
    endDuration: 3,
    endRotationSpeed: Math.PI * 6,

    doorOpenDuration: 0.1,
    doorWaitTime: 5,    // time 1 player has to wait for door.
    doorOpenTime: 0.25, // time door stays open
    maxVelocityBall: [200, 500],
    ballElasticity: 0.75,
    ballStopVelocity: 10,
    ballGravity: 300,
    ballWinGamePoints: 3,

    maxVelocityGift: [200, 500],
    giftElasticity: 0.25,
    giftStopVelocity: 10,
    giftGravity: 1000,
    giftMaxAllowed: 10,
    smallCoinScale: 0.75,
    allowStandOnPlayers: true,
    allowStoodOnToBumpYou: true,

    drawOffset: {},
  };
window.g = globals;

  function startLocalPlayers() {
    var localPlayers = [];

    if (globals.stressTest) {
      globals.numLocalPlayers = Math.max(globals.numLocalPlayers, globals.stressPlayerCount)
    }

    var addLocalPlayer = function() {
      var netPlayer = new LocalNetPlayer();
      var data = {
        avatarNdx: globals.avatarNdx,
        dest: localPlayers.length == 0 ? 1 : undefined,
        subDest: localPlayers.length == 0 ? 0 : undefined,
      };
      var player = g_playerManager.startPlayer(netPlayer, Strings.padLeft(localPlayers.length + 1, 2, "0"), data, true);
      localPlayers.push({
        player: player,
        netPlayer: netPlayer,
        leftRight: 0,
        oldLeftRight: 0,
        jump: false,
      });
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
  g_services.particleSystemManager = new ParticleSystemManager(2);
  g_services.avatars = avatars;

  if (globals.fullScreen) {
    document.body.addEventListener('click', function() {
      Fullscreen.requestFullScreen(document.body);
    }, false);
  }

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

  var createTexture = function(img, filter, preMult) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMult === false ? false : true);
    var tex = Textures.loadTexture(img);
    if (filter !== false) {
      tex.setParameter(gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      tex.setParameter(gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      tex.setParameter(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      tex.setParameter(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    return tex;
  };

  g_services.createTexture = createTexture;
  // colorize: number of colors to make
  // slizes: number = width of all slices, array = width of each consecutive slice
  var images = {
    brick:          { url: "assets/bricks.png",     preMult: false, },
    coin:           { url: "assets/coin_anim.png",  scale: 4, slices: 8, },
    door:           { url: "assets/door.png",       },
    doormeter:      { url: "assets/door-meter.png", },
    doormeterframe: { url: "assets/door-meter-frame.png", },
    ball:           { url: "assets/ball.png",       },
    balloon:        { url: "assets/Balloon_a.png",  filter: false, preMult: true },
    hat:            { url: "assets/partyhat.png",   },
    gem:            { url: "assets/gem.png",        scale: 1, slices: 16, },
    gift:           { url: "assets/gift.png",       },
    ghosts:         { url: "assets/ghosts.png",     filter: false, },
    "switch":       { url: "assets/switch.png",     },
  };

  // Add all the avatar files to the list of images to load.
  avatars.forEach(function(avatar) {
    Object.keys(avatar.anims).forEach(function(animName) {
      var anim = avatar.anims[animName];
      if (anim.urls) {
        anim.urls.forEach(function(url) {
          images[url] = {
            url: url,
            scale: anim.scale,
            filter: anim.filter !== undefined ? anim.filter : avatar.filter,
          };
        });
      } else {
        var name = avatar.name + "-" + animName;
        images[name] = anim;
      }
    });
  });

  g_services.images = images;
  var processImages = function() {
    Object.keys(images).forEach(function(name) {
      var image = images[name];
      ImageCutter.cutImage(image, {fn: createTexture});
    });

    var startGame = function() {

      // Now that the images are loaded copy them back into the avatar data
      avatars.forEach(function(avatar) {
        Object.keys(avatar.anims).forEach(function(animName) {
          var anim = avatar.anims[animName];
          if (anim.urls) {
            anim.frames = anim.urls.map(function(url) {
              return images[url].frames[0];
            });
          } else {
            var name = avatar.name + "-" + animName;
            anim.frames = images[name].frames;
          }
        });
      });

      var tileset = {
        tileWidth: 32,
        tileHeight: 32,
        tilesAcross: images.brick.img.width / 32,  // tiles across set
        tilesDown: images.brick.img.height / 32,   // tiles down set
        texture: images.brick.frames[0],
      };
      var g_levelManager = new LevelManager(
        g_services,
        tileset, {
          offEdgeTileId: globals.noExit ? 1 : undefined,
        });
      g_services.levelManager = g_levelManager;
      resize();

      g_services.particleEffectManager = new ParticleEffectManager(g_services);
      g_services.collectableManager = new CollectableManager(g_services);

      // create stuff
      var level = g_levelManager.getLevel();
      [
        {type: "teleport",     particleType: 0, constructor: ParticleEmitter,  },  // level to level telaports are not used
        {type: "end",          particleType: 1, constructor: ParticleEmitter,  },
        {type: "teleportDest", particleType: 2, constructor: ParticleEmitter,  },
        {type: "candle",       particleType: 3, constructor: ParticleEmitter,  },
        {type: "door",                          constructor: Door,    },
        {type: "ball",                          constructor: Ball,    },
        {type: "coingen",                       constructor: CoinGen, },
        {type: "flyingportal",                 constructor: FlyingPortal, },
     ].forEach(function(type) {
        var teleports = level.getThings(type.type);
        if (teleports) {
          Object.keys(teleports).forEach(function(key) {
            teleports[key].forEach(function(teleport) {
              new (type.constructor)(
                g_services,
                teleport,
                type);
            });
          });
        }
      });

      switch (globals.levelName) {
      case "level3-0":
        g_services.particleEffectManager.createGhosts();
        g_services.particleEffectManager.createRain();
        break;
      case "level4-0":
        g_services.particleEffectManager.createSnow();
        break;
      case "level5-0":
        g_services.particleEffectManager.createBalloons();
        $("score").style.display = "block";
        g_services.scoreManager = new ScoreManager(
          g_services, $("top-today"), $("top-hour"), $("top-10mins"));
        break;
      }

      startLocalPlayers();

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
      GameSupport.run(globals, mainloop);
    };

    document.title = "Tonde-Iko: " + (globals.levelName ? globals.levelName : "*level*");
    if (globals.levelName) {
      var realImageMappings = {
        "assets/bricks.png": "assets/bricks-real.png",
      };
      var loaderOptions = {
        imageMappings: globals.debug ? {} : realImageMappings,
      };
      LevelLoader.load(gl, "assets/" + globals.levelName + ".json", loaderOptions, function(err, level) {
        if (err) {
          throw err;
        }
        level.layers = level.layers.map(function(layer) {
          return new Level(layer);
        });
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
    gl.scissor(xtraX, xtraY, level.levelWidth, level.levelHeight);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(
        globals.level.backgroundColor[0],
        globals.level.backgroundColor[1],
        globals.level.backgroundColor[2],
        globals.level.backgroundColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);

    // test particles
    if (globals.frameCount % 60 == 0) {
      //g_services.particleEffectManager.spawnConfetti(Misc.randInt(1280), Misc.randInt(720));
      //if (g_services.scoreManager) {
      //  g_services.scoreManager.addPlayer({
      //    score: 5 + Misc.randInt(5000),
      //    name: String.fromCharCode(Misc.randInt(26) + 0x41, Misc.randInt(26) + 0x41),
      //    color: {
      //      h: Math.random(),
      //    },
      //    avatarNdx: Misc.randInt(g_services.avatars.length),
      //  });
      //}
    }

    var layerNdx = 0;
    var layers    = globals.level.layers;
    var numLayers = layers.length;
    if (globals.playLevel) {
      // Draw all layers before and including playLevel
      for (; layerNdx < numLayers && layer !== globals.playLevel; ++layerNdx) {
        var layer = layers[layerNdx];
        if (layer === globals.playLevel) {
          g_services.particleSystemManager.drawParticleSystemBehindLevel(globals.drawOffset);
          gl.disable(gl.BLEND);
        }
        layer.draw(g_services.levelManager, globals);
      }
    }

    g_services.particleSystemManager.drawParticleSystemBehindPlayer(globals.drawOffset);
    gl.disable(gl.BLEND);

    g_services.drawSystem.processEntities();


    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendEquation(gl.FUNC_ADD);
    g_services.spriteManager.draw();
    gl.disable(gl.BLEND);

    if (globals.playLevel) {
      // Draw the remaining layers
      for(; layerNdx < numLayers; ++layerNdx) {
        var layer = layers[layerNdx];
        layer.draw(g_services.levelManager, globals);
      }
    }
    g_services.particleSystemManager.drawParticleSystemInFrontOfPlayer(globals.drawOffset);

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
    jump:              { jsfx: ["square",0.0000,0.4000,0.0000,0.0960,0.0000,0.1720,20.0000,245.0000,2400.0000,0.3500,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.5000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    coinland:          { jsfx: ["square",0.0000,0.4000,0.0000,0.0520,0.3870,0.1160,20.0000,1050.0000,2400.0000,0.0000,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    bonkhead:          { jsfx: ["sine",0.0000,0.4000,0.0000,0.0000,0.5070,0.1400,20.0000,1029.0000,2400.0000,-0.7340,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3780,0.0960,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000], },
    land:              { jsfx: ["sine",0.0000,0.4000,0.0000,0.1960,0.0000,0.1740,20.0000,1012.0000,2400.0000,-0.7340,0.0000,0.0000,0.0100,0.0003,0.0000,0.0000,0.0000,0.3780,0.0960,0.0000,0.0000,0.0000,1.0000,0.0000,0.0000,0.0000,0.0000] , },
  };
  var audioManager = new AudioManager(globals.mute ? {} : sounds);
  g_services.audioManager = audioManager;
});


