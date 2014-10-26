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
    'hft/misc/misc',
    '../bower_components/hft-utils/dist/2d',
    './math',
  ], function(
    Misc, M2D, gmath) {

  /**
   * DoorSwitch
   * @constructor
   */
  var DoorSwitch = function(services, door, data) {
    this.services = services;
    this.door = door;
    var globals = services.globals;

    services.entitySystem.addEntity(this);
    services.drawSystem.addEntity(this);

    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.width = level.tileWidth;
    this.height = level.tileHeight;
    this.position = [
      (data.tx + 0.5) * level.tileWidth,
      (data.ty +   1) * level.tileHeight
    ];

    this.anim = this.services.images.switch.frames;
    this.sprite = this.services.spriteManager.createSprite();
    this.sprite.uniforms.u_hsvaAdjust = [data.tileInfo.id / 3, 0, 0, 0];
    this.setState("up");
    this.onCount = 0;
  };

  DoorSwitch.prototype.switchOn = function() {
    // use a count so this lasts 2 frames.
    // otherwise if the DoorSwitch is processed
    // before one of the player it won't get scene.
    this.onCount = 5;
  };

  DoorSwitch.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  DoorSwitch.prototype.init_up = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    this.height = level.tileHeight;
  };

  DoorSwitch.prototype.state_up = function() {
    if (this.onCount) {
      this.setState("down");
    }
  };

  DoorSwitch.prototype.init_down = function() {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    this.height = level.tileHeight / 4 * 3;
  };

  DoorSwitch.prototype.state_down = function() {
    if (this.onCount) {
      this.door.open();
    } else {
      this.setState("up");
    }
  };

  DoorSwitch.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    var spriteRenderer = this.services.spriteRenderer;
    var images = this.services.images;
    var img = this.anim[0];

this.services.debugRenderer.addX(
  this.position[0], this.position[1], 10, this.onCount ? 0xFF0000FF : 0xFFFFFFFF);
this.onCount = Math.max(0, this.onCount - 1);

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = globals.drawOffset.x + (this.position[0]                  ) * globals.scale;
    sprite.y = globals.drawOffset.y + (this.position[1] - this.height / 2) * globals.scale;
    sprite.width  = this.width  * globals.scale;
    sprite.height = this.height * globals.scale;
  };

  /**
   * Door
   * @constructor
   */
  var Door = function(services, data) {
    this.services = services;
    var globals = services.globals;

    services.entitySystem.addEntity(this);
    services.drawSystem.addEntity(this);

    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.doorTimer = 0;
    this.openTimer = 0;
    this.width = level.tileWidth;
    this.height = level.tileHeight * 2;
    this.position = [
      (data.tx + 0.5) * level.tileWidth,
      (data.ty +   1) * level.tileHeight
    ];
    this.id = data.tileInfo.id;

    this.data = data;
    this.doorTile = level.getTile(data.tx, data.ty);

    // Find the corresponding swtich
    var switches = level.getThings("switch");
    if (!switches) {
      return this.kill("no switches for doors");
    }
    var sws = switches[data.tileInfo.id];
    if (!sws) {
      return this.kill("Missing switch for door id: " + data.tileInfo.id);
    }

    this.doorSwitches = sws.map(function(doorInfo) {
      var doorSwitch = new DoorSwitch(services, this, doorInfo);
      // Link back from level to doorSwitch. So, given a tileInfo (level.getTileInfoByPixel)
      // if it's a thing = "switch" then you can do level.getThings("switch")[tile.id][0].doorSwitch
      // to get the object that corresponds to that switch
      doorInfo.doorSwitch = doorSwitch;
      return doorSwitch;
    }.bind(this));

    var allAreas = level.getThings("area");
    if (!allAreas) {
      return this.kill("No areas for doors");
    }
    var areas = allAreas[data.tileInfo.id];
    if (!areas) {
      return this.kill("Missing areas for door id: " + data.tileInfo.id);
    }

    var makeRect = function(area) {
      return new gmath.Rect(area.tx * level.tileWidth, area.ty * level.tileHeight, level.tileWidth, level.tileHeight + 2);
    };

    var r = makeRect(areas[0]);
    areas.forEach(function(area) {
      r.union(makeRect(area));
    });

    this.area = r;
    this.doorArea = new gmath.Rect(
      this.position[0] - level.tileWidth * 1.5,
      this.position[1] - level.tileHeight * 2,
      level.tileWidth * 2,
      level.tileHeight * 2 + 2);

    this.anim = this.services.images.door.frames;
    this.sprite = this.services.spriteManager.createSprite();
    this.hsva = [data.tileInfo.id / 3, 0, 0, 0];
    this.sprite.uniforms.u_hsvaAdjust = this.hsva;

    this.meterHsva = this.hsva.slice();
    this.meterSprite = this.services.spriteManager.createSprite();
    this.meterSprite.uniforms.u_hsvaAdjust = this.meterHsva;
    this.frameSprite = this.services.spriteManager.createSprite();
    this.frameSprite.uniforms.u_hsvaAdjust = this.meterHsva.slice();
    this.meterImg = this.services.images.doormeter.frames[0];
    this.frameImg = this.services.images.doormeterframe.frames[0];
    this.meterSprite.uniforms.u_texture = this.meterImg;
    this.frameSprite.uniforms.u_texture = this.frameImg;

    this.setState("closed");
    this.countFn = Door.prototype.addPlayerIfInArea.bind(this);
  };

  Door.prototype.setTiles = function(tileId) {
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    level.setTile(this.data.tx, this.data.ty    , tileId);
    level.setTile(this.data.tx, this.data.ty - 1, tileId);
  };

  Door.prototype.kill = function(msg) {
    this.process = function() {};
    this.draw = function() {};
    this.services.gameSupport.log(msg);
  };

  // Tell door to open (it might already be open)
  Door.prototype.open = function() {
    var globals = this.services.globals;
    this.openTimer = 3;
    this.doorTimer = Math.max(this.doorTimer - globals.elapsedTime, 0);
    if (this.state == "closed") {
      this.setState("opening");
    }
  };

  Door.prototype.setState = function(state) {
    this.state = state;
    var init = this["init_" + state];
    if (init) {
      init.call(this);
    }
    this.process = this["state_" + state];
  };

  Door.prototype.addPlayerIfInArea = function(player) {
    if (this.area.isPointIn(player.position[0], player.position[1])) {
      ++this.numPlayersInArea;
    }
    if (this.doorArea.isPointIn(player.position[0], player.position[1])) {
      ++this.numPlayersInDoorArea;
    }
  };

  Door.prototype.countPlayersInArea = function() {
    this.numPlayersInArea = 0;
    this.numPlayersInDoorArea = 0;
    this.services.playerManager.forEachPlayer(this.countFn);
this.services.status.addMsg("a# " + this.id + " : inArea = " + this.numPlayersInArea + " : @door = " + this.numPlayersInDoorArea);
  };

  Door.prototype.resetDoor = function() {
    var globals = this.services.globals;
    this.doorTimer = globals.doorWaitTime;
    this.meterSprite.visible = false;
    this.frameSprite.visible = false;
  };

  Door.prototype.init_closed = function() {
    this.resetDoor();
    this.setTiles(this.doorTile);
    this.meterSprite.visible = false;
    this.frameSprite.visible = false;
  };

  Door.prototype.state_closed = function() {
    var globals = this.services.globals;
    if (this.doorTimer < globals.doorWaitTime) {
      this.setState("opening");
    }
  };

  Door.prototype.init_opening = function() {
    this.meterSprite.visible = true;
    this.frameSprite.visible = true;
    this.animTimer = 0;
    this.setTiles(0);
  };

  Door.prototype.state_opening = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.animTimer += globals.elapsedTime;
    var lerp = this.animTimer / globals.doorOpenDuration;
    this.hsva[3] = gmath.clampedLerp(0, -1, lerp);
    this.width = gmath.clampedLerp(level.tileWidth, 0, lerp);
    if (lerp >= 1) {
      this.setState("opened");
    }
  };

  Door.prototype.init_opened = function() {
  };

  Door.prototype.state_opened = function() {
    var globals = this.services.globals;
    this.countPlayersInArea();
    if (this.openTimer) {
      --this.openTimer;
    } else {
      this.doorTimer = Math.min(this.doorTimer + globals.elapsedTime, globals.doorWaitTime);
      if (this.doorTimer >= globals.doorWaitTime) {
        // If there's no players in the door
        if (this.numPlayersInDoorArea == 0) {
          this.setState("closing");
        }
      }
    }
  };

  Door.prototype.init_closing = function() {
    this.animTimer = 0;
  };

  Door.prototype.state_closing = function() {
    var globals = this.services.globals;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();

    this.animTimer += globals.elapsedTime;
    var lerp = this.animTimer / globals.doorOpenDuration;
    this.hsva[3] = gmath.clampedLerp(-1, 0, lerp);
    this.width = gmath.clampedLerp(0, level.tileWidth, lerp);
    if (lerp >= 1) {
      this.setState("closed");
    }
  };

  Door.prototype.draw = function(ctx) {
    var globals = this.services.globals;
    var spriteRenderer = this.services.spriteRenderer;
    var images = this.services.images;
    var img = this.anim[0];

    var sprite = this.sprite;
    sprite.uniforms.u_texture = img;
    sprite.x = globals.drawOffset.x + (this.position[0]                  ) * globals.scale;
    sprite.y = globals.drawOffset.y + (this.position[1] - this.height / 2) * globals.scale;
    sprite.width  = this.width  * globals.scale;
    sprite.height = this.height * globals.scale;

    var lerp = this.doorTimer / globals.doorWaitTime;
    this.meterHsva[3] = (Math.sin(lerp * lerp * 200) * 0.5 - 0.5);
    this.meterSprite.x      = sprite.x + 28;
    this.meterSprite.y      = sprite.y + this.meterImg.img.height * lerp * 0.5;
    this.meterSprite.width  = this.meterImg.img.width  * globals.scale;
    this.meterSprite.height = this.meterImg.img.height * globals.scale * (1 - lerp);
    this.frameSprite.x      = this.meterSprite.x;
    this.frameSprite.y      = sprite.y;
    this.frameSprite.width  = this.frameImg.img.width  * globals.scale;
    this.frameSprite.height = this.frameImg.img.height * globals.scale;


this.services.debugRenderer.addX(
  this.position[0], this.position[1], 10, 0xFFFFFFFF);
this.services.debugRenderer.addRect(this.area, 0xFFFFFFFF);
this.services.debugRenderer.addRect(this.doorArea, 0x00FF00FF);

  };

  return Door;
});

