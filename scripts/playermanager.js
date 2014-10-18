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
    './player'
  ], function(
    Player) {

  var PlayerManager = function(services) {
    this.services = services;
    this.players = [];
  };

  PlayerManager.prototype.startPlayer = function(netPlayer, name, data, isLocalPlayer) {
    var misc = this.services.misc;
    var levelManager = this.services.levelManager;
    var level = levelManager.getLevel();
    var direction = misc.randInt(2) ? -1 : 1;
    var startPosition;
    var destId = 1;
    var subDestId = 0;
    if (data) {
      name = data.name || name;
    }
    if (data && data.dest === undefined && data.position) {
      // We teleported by hitting the edge of the level
      startPosition = {
        x: data.position[0] < level.levelWidth / 2 ? level.levelWidth + level.tileWidth / 4 : -level.tileWidth / 4,
        y: data.position[1],
      };
    } else {
      if (data) {
        destId = data.dest;
        subDestId = data.subDest;
      }
      var dest = level.getDest(destId, subDestId);
      if (dest) {
        dest = dest[misc.randInt(dest.length)];
        startPosition = { x: dest.tx, y: dest.ty };
      } else if (!isLocalPlayer) {
        // I don't remember what this is for. I think it's if there is no sub dest just put the player
        // on the left or right. It's left over from the first impl of teleporting and can probably
        // be deleted.
        if (destId == 1) {
          startPosition = { x: level.width - 3, y: 2};
        } else {
          startPosition = { x: 2, y: 2};
        }
      }
      if (startPosition) {
        startPosition.x = (startPosition.x + 0.5) * level.tileWidth;
        startPosition.y = (startPosition.y +   1) * level.tileHeight - 1;
        direction = startPosition.x < level.levelWidth / 2 ? 1 : -1;
      }
    }
    var player = new Player(this.services, level.tileWidth, level.tileHeight, direction, name, netPlayer, startPosition, data, isLocalPlayer);
    this.players.push(player);
    return player;
  }

  PlayerManager.prototype.removePlayer = function(playerToRemove) {
    var netPlayer = playerToRemove.netPlayer;
    for (var ii = 0; ii < this.players.length; ++ii) {
      var player = this.players[ii];
      if (player.netPlayer === netPlayer) {
        this.players.splice(ii, 1);
        return;
      }
    }
  };

  PlayerManager.prototype.forEachPlayer = function(callback) {
    for (var ii = 0; ii < this.players.length; ++ii) {
      if (callback(this.players[ii])) {
        return this;
      }
    }
  };

  PlayerManager.prototype.getNumPlayers = function() {
    return this.players.length;
  };

  return PlayerManager;
});

