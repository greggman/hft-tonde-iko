Making
======

I've forced this to be 6 screens, 1920x1080. With 32x32 pixel tiles that's 60x33 tiles per screen.

I've made 1 map for each screen, they are stored in

    assets/level0-0.tmx
    assets/level1-0.tmx
    assets/level2-0.tmx
    assets/level3-0.tmx
    assets/level4-0.tmx
    assets/level5-0.tmx

Each screen-map is allowed **ONE** tileset. Currently all the maps are using a "bricks" tileset.

## Making a new Tileset

To make a new tileset create a PNG file that is some multiple of 32x32. Run Tiled, load the map
you want to change the tileset on.

*   Pick Map->New Tileset, pick your png. Note: your PNG **MUST BE IN THE ASSETS FOLDER**.

    <img src="src/making-tileset.png" width="505" height="472" />

*   Delete the old tileset. Select the old tileset (probably "bricks") and click the trashcan

    <img src="src/deleting-old-tileset.png" width="419" height="271" />

## Assign Meanings to tiles

I choose a 1x1 meaning system meaning each visual tile is allowed only 1 specific meaning.
To assign these meanings

1.  make new map in tiled.

    <img src="src/making-meaning-map.png" width="526" height="455" />

2.  Then load the `tile-meaning-icons.png` as a tileset

    <img src="src/tile-meaning-icons-tileset.png" width="505" height="472" />

3.  Next load your tileset png as a tileset

    <img src="src/making-tileset.png" width="505" height="472" />

4.  Place your tiles in even rows (where the top row is row 0) and place
    meaning tiles on the row under them to give them a meaning

    <img src="src/meaning-map.png" width="773" height="847" />

    In the picture above you should be able to see the first 2 tiles are
    assigned a "sky" meaning. The next 3 tiles are assigned a "solid* meaning
    and last tile is assigned a "sky" meaning

5.  Save the file with the same name as your tileset png except change the end
    to "-meaning". In other words, if you had png called `my-tiles.png` you'd
    have a corresponding `my-tiles-meaning.tmx` file beside it.




